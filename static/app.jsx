const { useState, useCallback, useEffect, useRef } = React;

// ORIGINAL THEMES BACKUP — DO NOT DELETE
// const THEMES = {
//   ember: { name:"Ember", accent:"#ff6b35", bg:"#0c0a0f", card:"#1a1018", card2:"#221620", border:"#3a2230", input:"#120c10", swatch:"#ff6b35" },
//   ocean: { name:"Ocean", accent:"#00b4d8", bg:"#060d1a", card:"#0c1627", card2:"#101c30", border:"#1a3050", input:"#091220", swatch:"#00b4d8" },
//   forest: { name:"Forest", accent:"#06d6a0", bg:"#060e0a", card:"#0c1c14", card2:"#10241a", border:"#18382a", input:"#091410", swatch:"#06d6a0" },
//   violet: { name:"Violet", accent:"#a78bfa", bg:"#0a0814", card:"#14102a", card2:"#1a1634", border:"#2a2248", input:"#0e0c1e", swatch:"#a78bfa" },
//   sunset: { name:"Sunset", accent:"#f472b6", bg:"#10080e", card:"#1c101a", card2:"#241622", border:"#3a2036", input:"#140c12", swatch:"#f472b6" },
//   gold: { name:"Gold", accent:"#ffd166", bg:"#0e0c06", card:"#1a1608", card2:"#221e0e", border:"#362c16", input:"#14100a", swatch:"#ffd166" },
//   mono: { name:"Mono", accent:"#94a3b8", bg:"#0a0a0c", card:"#151518", card2:"#1c1c20", border:"#2a2a30", input:"#101012", swatch:"#94a3b8" },
// };

const THEMES = {
  // ── Dark ──
  ocean:      { name:"Ocean",        accent:"#00b4d8", accent2:"#6898c8", bg:"linear-gradient(165deg,#04101e 0%,#081828 40%,#0a1420 100%)", card:"#0b1a2e", card2:"#0f2038", border:"#183854", input:"#081422", text:"#e2e8f0", dim:"#64748b", dimBright:"#8494a7", swatch:"#00b4d8" },
  strava:     { name:"Strava",       accent:"#FC4C02", accent2:"#e8a04a", bg:"linear-gradient(165deg,#08080a 0%,#0e0e12 40%,#0a0a0e 100%)", card:"#141418", card2:"#1a1a1e", border:"#2a2a30", input:"#101014", text:"#e2e8f0", dim:"#7a7a84", dimBright:"#9a9aa4", swatch:"#FC4C02" },
  forest:     { name:"Forest",       accent:"#06d6a0", accent2:"#4ab896", bg:"linear-gradient(165deg,#060e0c 0%,#0a1814 40%,#081210 100%)", card:"#0c1e18", card2:"#102620", border:"#184034", input:"#091610", text:"#e2e8f0", dim:"#5a8a78", dimBright:"#7aaa98", swatch:"#06d6a0" },
  midnight:   { name:"Midnight",     accent:"#5b8dee", accent2:"#8daee8", bg:"linear-gradient(165deg,#060a14 0%,#0c1226 40%,#08101c 100%)", card:"#0e1428", card2:"#121a34", border:"#1e2e50", input:"#0a1020", text:"#e2e8f0", dim:"#5a6a8a", dimBright:"#7a8aaa", swatch:"#5b8dee" },
  slate:      { name:"Slate",        accent:"#94a3b8", accent2:"#6b8aad", bg:"linear-gradient(165deg,#0c0d10 0%,#12141a 40%,#0e1014 100%)", card:"#16181e", card2:"#1c1e26", border:"#2a2e38", input:"#101214", text:"#e2e8f0", dim:"#64748b", dimBright:"#8494a7", swatch:"#94a3b8" },
  // ── Light ──
  minimalGray:{ name:"Minimal Gray", accent:"#64748b", accent2:"#8494a7", bg:"linear-gradient(165deg,#eaecf0 0%,#f1f3f6 40%,#e8eaee 100%)", card:"#ffffff", card2:"#f6f7f9", border:"#d4d8e0", input:"#f0f1f4", text:"#1a1e2a", dim:"#6b7280", dimBright:"#8b929f", swatch:"#64748b" },
  oceanLight: { name:"Ocean Light",  accent:"#0891b2", accent2:"#5ba8c8", bg:"linear-gradient(165deg,#e6f2f8 0%,#eef6fb 40%,#e2eef6 100%)", card:"#ffffff", card2:"#f2f8fb", border:"#c4dce8", input:"#edf4f8", text:"#1a2430", dim:"#5a7a8a", dimBright:"#7a9aaa", swatch:"#0891b2" },
  forestLight:{ name:"Forest Light", accent:"#059669", accent2:"#3aa886", bg:"linear-gradient(165deg,#e8f5f0 0%,#eef8f4 40%,#e4f2ec 100%)", card:"#ffffff", card2:"#f2f9f6", border:"#c0ddd0", input:"#ecf5f0", text:"#1a2a22", dim:"#5a8a70", dimBright:"#7aaa90", swatch:"#059669" },
  sunsetLight:{ name:"Sunset Light", accent:"#e07028", accent2:"#d4945a", bg:"linear-gradient(165deg,#f8f0e8 0%,#fbf4ee 40%,#f6ece2 100%)", card:"#ffffff", card2:"#faf6f2", border:"#e4d4c4", input:"#f6f0ea", text:"#2a2018", dim:"#8a7a6a", dimBright:"#a09080", swatch:"#e07028" },
  stravaLight:{ name:"Strava Light", accent:"#FC4C02", accent2:"#e8884a", bg:"linear-gradient(165deg,#f2f0ee 0%,#f8f6f4 40%,#eeedeb 100%)", card:"#ffffff", card2:"#f8f7f6", border:"#d8d4d0", input:"#f2f0ee", text:"#1a1a1a", dim:"#6b6b6b", dimBright:"#8a8a8a", swatch:"#FC4C02" },
};

const B = { green:"#06d6a0", cyan:"#00b4d8", gold:"#ffd166", coral:"#ff6b6b", lavender:"#a78bfa" };

const fontStack = "'Inter',system-ui,-apple-system,sans-serif";

const PulseIcon = ({size=24,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 4 18 3-9h6"/></svg>;
const ShoeIcon = ({size=14,color="#64748b"}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18h18v-2c0-1-1-2-2-2h-1l-2-4c-.5-1-1.5-2-3-2H9C7.5 8 6.5 9 6 10L4 14H3c-1 0-2 1-2 2v2z"/><path d="M7 18v-3"/><path d="M11 18v-5"/><path d="M15 18v-3"/></svg>;
const MapPinIcon = ({size=20,color="#64748b"}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const SunIcon = ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg>;
const CloudSunIcon = ({size=16,bgFill="#1e2d3d"}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2v2m-6.36.64l1.42 1.42M2 12h2" stroke="#fbbf24"/><circle cx="12" cy="10" r="4" stroke="#fbbf24"/><path d="M17.5 21H9a5 5 0 0 1-.5-9.97A7 7 0 0 1 20.5 14 4 4 0 0 1 17.5 21z" fill={bgFill} stroke="#94a3b8"/></svg>;

const RUN_TYPES = [
  { name:"Easy Long Run", color:B.cyan },
  { name:"Easy Run", color:B.green },
  { name:"Interval Run", color:B.gold },
  { name:"Long Run", color:B.coral },
  { name:"Progressive Run", color:B.lavender },
  { name:"Standard Run", color:"#8494a7" },
  { name:"Tempo Run", color:"ACCENT" },
];

const PLAN_DEFAULTS = [
  { type:"Easy Long Run", count:1, notes:"10–15 mi @ 8:30–9:00/mi" },
  { type:"Easy Run", count:2, notes:"5–7 mi @ 8:30–9:00/mi" },
  { type:"Interval Run", count:1, notes:"5×1mi @ 7:00/mi w/ 60s rest" },
  { type:"Long Run", count:0, notes:"" },
  { type:"Progressive Run", count:0, notes:"" },
  { type:"Standard Run", count:0, notes:"" },
  { type:"Tempo Run", count:1, notes:"5–10 mi @ 7:30–8:30/mi" },
];

// Demo polylines: realistic road-following routes in Concord/Walnut Creek/Pleasant Hill CA
// Route A: Iron Horse Trail out-and-back (~6.5mi) — south from Coggins Dr to Ygnacio Valley Rd and back
const _POLY_OB = "gusfFnf_hV~C{@~CoArDoArDoArDoArD{@fE{@fE{@fE{@fEg@fEg@fESfESfE?fERfEf@fEz@fEz@fEnAfEnAfEnAfEnAfEnAfEbBfEnAfEnAfEnAfEz@fEz@fEf@fEf@~Cf@eDc@gEg@gEg@gE{@gE{@gEoAgEoAgEcBgEoAgEoAgEoAgEoAgEoAgE{@gE{@gEg@gESgE?gERgERgEf@gEf@gEf@gEz@gEz@sDz@sDnAsDnAsDnA_DnA_Dz@";
// Route B: Neighborhood loop through downtown Concord grid streets (~4.5mi)
const _POLY_GRID = "knxfFz`zgV?gE?gE?gE?gE?gE?gE?gE?gE?gE?gEf@g@bB?bB?bB?bB?bB?bB?bB?bB?bB?bB?bB?bB?f@f@?fE?fE?fE?fE?fE?fE?fE?fE?fE?fE?fE?fE?fEg@f@cB?cB?cB?cB?cB?cB?cB?cB?cB?cB?cB?cB?g@g@?gE?gE?gE";
// Route C: Long multi-turn route through Concord → Monument → Treat → WC → Ygnacio → Contra Costa → back (~13mi)
const _POLY_TURNS = "oqxfF~jygVbBbBbBbBbBf@jCf@~Cf@~Cf@jCf@jCvB~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~C~CbBnAbBg@nAwBz@_Dz@gEf@gEf@gEf@gEf@gEf@gEf@gEf@gEf@gEf@gEf@gEf@gEf@gEf@gEvBoA~Cg@~Cg@~Cg@~Cg@~Cg@~Cg@~Cg@~Cg@~Cg@~Cg@~Cg@~Cg@~Cg@~Cg@vBf@nAvBf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEf@fEoAvBwBnA_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_Df@_DoAwB_DwB_DwB_DwB_DwB_DwB_DwB_DwB_D_D_D_D_D_D_D_D_D_D_D_D_D_D_DgEwBgEwBgEwBgEwBgEwBgEwBgE_DgE_DgE_DgEgEgEgEkCgEkCgEwBgEwBgEwB_D";
const ACTIVITIES = [
  { id:1, title:"Morning Long Run", date:"7:24 AM · Feb 11", start_date_local:"2026-02-11T07:24:00", distance:"13.3 mi", pace:"7:42 /mi", time:"1h 42m", elev:"512 ft", shoe:"Adidas Neon Green EVO SL 1", device:"Garmin Forerunner 970", runType:"Easy Long Run", sport:"run", city:"Concord, California", polyline:_POLY_TURNS, description:"Bring more water next time. Felt good through mile 8 but started to fade. Need to fuel better on long runs. Also the left knee was a bit tight on the downhills — should stretch more before heading out.",
    splits:[{m:1,p:"7:55",e:"-42ft"},{m:2,p:"7:48",e:"18ft"},{m:3,p:"7:42",e:"-12ft"},{m:4,p:"7:38",e:"31ft"},{m:5,p:"7:45",e:"-8ft"},{m:6,p:"7:40",e:"22ft"},{m:7,p:"7:36",e:"-15ft"},{m:8,p:"7:42",e:"45ft"},{m:9,p:"7:39",e:"-28ft"},{m:10,p:"7:44",e:"12ft"},{m:11,p:"7:35",e:"-6ft"},{m:12,p:"7:41",e:"38ft"},{m:13,p:"7:30",e:"-22ft"}], cal:1124, eff:142 },
  { id:2, title:"Easy Recovery Run", date:"6:15 AM · Feb 10", start_date_local:"2026-02-10T06:15:00", distance:"8.1 mi", pace:"8:24 /mi", time:"1h 8m", elev:"245 ft", shoe:"Adidas Blue 1 EVO SL", device:"Garmin Forerunner 970", runType:null, sport:"run", city:"Concord, California", polyline:_POLY_GRID,
    splits:[{m:1,p:"8:32",e:"-18ft"},{m:2,p:"8:28",e:"22ft"},{m:3,p:"8:20",e:"-8ft"},{m:4,p:"8:25",e:"35ft"},{m:5,p:"8:22",e:"-12ft"},{m:6,p:"8:18",e:"28ft"},{m:7,p:"8:30",e:"-15ft"},{m:8,p:"8:24",e:"18ft"}], cal:682, eff:88 },
  { id:3, title:"Tempo Run", date:"5:45 AM · Feb 9", start_date_local:"2026-02-09T05:45:00", distance:"4.8 mi", pace:"7:18 /mi", time:"35m", elev:"128 ft", shoe:"Adidas Red 2 EVO SL", device:"Garmin Forerunner 970", runType:"Tempo Run", sport:"run", city:"Concord, California", polyline:_POLY_OB,
    splits:[{m:1,p:"7:25",e:"12ft"},{m:2,p:"7:18",e:"-8ft"},{m:3,p:"7:15",e:"22ft"},{m:4,p:"7:12",e:"-18ft"}], cal:412, eff:72 },
  { id:4, title:"Morning Shakeout", date:"7:00 AM · Feb 7", start_date_local:"2026-02-07T07:00:00", distance:"6.2 mi", pace:"8:05 /mi", time:"50m", elev:"184 ft", shoe:"Adidas Neon Green EVO SL 1", device:"Garmin Forerunner 970", runType:"Easy Standard Run", sport:"run", city:"Concord, California", polyline:_POLY_GRID,
    splits:[{m:1,p:"8:12",e:"-22ft"},{m:2,p:"8:08",e:"15ft"},{m:3,p:"8:02",e:"-8ft"},{m:4,p:"8:05",e:"28ft"},{m:5,p:"8:00",e:"-12ft"},{m:6,p:"7:58",e:"18ft"}], cal:528, eff:62 },
  { id:5, title:"Wednesday Hills", date:"6:30 AM · Jan 29", start_date_local:"2026-01-29T06:30:00", distance:"7.3 mi", pace:"8:15 /mi", time:"1h 0m", elev:"380 ft", shoe:"Adidas Red EVO SL", device:"Garmin Forerunner 970", runType:null, sport:"run", city:"Concord, California", polyline:_POLY_TURNS,
    splits:[{m:1,p:"8:22",e:"45ft"},{m:2,p:"8:30",e:"62ft"},{m:3,p:"8:18",e:"-28ft"},{m:4,p:"8:05",e:"-35ft"},{m:5,p:"8:10",e:"48ft"},{m:6,p:"8:20",e:"-32ft"},{m:7,p:"8:12",e:"-15ft"}], cal:618, eff:78 },
];

const WEATHER = [
  { time:"9 AM", temp:48, rain:"5%", wind:"3 mph", type:"cloud", dayOffset:0 },
  { time:"10 AM", temp:52, rain:"2%", wind:"4 mph", type:"cloud", dayOffset:0 },
  { time:"11 AM", temp:55, rain:"2%", wind:"5 mph", type:"sun", dayOffset:0 },
  { time:"12 PM", temp:58, rain:"2%", wind:"5 mph", type:"sun", dayOffset:0 },
  { time:"1 PM", temp:60, rain:"0%", wind:"6 mph", type:"sun", dayOffset:0 },
  { time:"2 PM", temp:59, rain:"0%", wind:"5 mph", type:"sun", dayOffset:0 },
  { time:"3 PM", temp:57, rain:"0%", wind:"4 mph", type:"sun", dayOffset:0 },
  { time:"4 PM", temp:54, rain:"5%", wind:"3 mph", type:"cloud", dayOffset:0 },
  { time:"5 PM", temp:51, rain:"8%", wind:"3 mph", type:"cloud", dayOffset:0 },
  { time:"6 AM", temp:44, rain:"10%", wind:"5 mph", type:"cloud", dayOffset:1 },
  { time:"7 AM", temp:45, rain:"8%", wind:"5 mph", type:"cloud", dayOffset:1 },
  { time:"8 AM", temp:47, rain:"5%", wind:"4 mph", type:"cloud", dayOffset:1 },
  { time:"9 AM", temp:50, rain:"2%", wind:"4 mph", type:"sun", dayOffset:1 },
  { time:"10 AM", temp:54, rain:"0%", wind:"5 mph", type:"sun", dayOffset:1 },
  { time:"11 AM", temp:57, rain:"0%", wind:"5 mph", type:"sun", dayOffset:1 },
  { time:"12 PM", temp:60, rain:"0%", wind:"6 mph", type:"sun", dayOffset:1 },
  { time:"1 PM", temp:62, rain:"0%", wind:"6 mph", type:"sun", dayOffset:1 },
  { time:"2 PM", temp:61, rain:"5%", wind:"5 mph", type:"sun", dayOffset:1 },
];

const WEEK_DAYS = [
  { day:"Mon",date:9,miles:4.8,sport:"run" },{ day:"Tue",date:10,miles:8.1,sport:"run" },{ day:"Wed",date:11,miles:13.3,sport:"run" },
  { day:"Thu",date:12,miles:0,today:true },{ day:"Fri",date:13,miles:0 },{ day:"Sat",date:14,miles:0 },
  { day:"Sun",date:15,miles:0 },
];

const PAST_WEEKS = [
  { label:"Jan 27 – Feb 2", miles:28.4, time:"3h 45m", days:[{d:"M",mi:0},{d:"T",mi:5.1},{d:"W",mi:7.3},{d:"Th",mi:0},{d:"F",mi:6.8},{d:"Sa",mi:9.2},{d:"Su",mi:0}] },
  { label:"Jan 20 – 26", miles:31.7, time:"4h 8m", days:[{d:"M",mi:4.2},{d:"T",mi:0},{d:"W",mi:6.5},{d:"Th",mi:5.8},{d:"F",mi:0},{d:"Sa",mi:10.1},{d:"Su",mi:5.1}] },
  { label:"Jan 13 – 19", miles:35.2, time:"4h 35m", days:[{d:"M",mi:0},{d:"T",mi:6.0},{d:"W",mi:8.2},{d:"Th",mi:0},{d:"F",mi:7.5},{d:"Sa",mi:13.5},{d:"Su",mi:0}] },
];

const ALL_SHOES = [
  { name:"Adidas Neon Green EVO SL 1", miles:189, max:300 },
  { name:"Adidas Blue 1 EVO SL", miles:177, max:300 },
  { name:"Adidas Red 2 EVO SL", miles:132, max:300 },
  { name:"Adidas Red EVO SL", miles:131, max:300 },
  { name:"Adidas Blue 2 EVO SL", miles:117, max:300 },
  { name:"Adidas Silver and Red EVO SL 1", miles:73, max:300 },
  { name:"ASICS Novablast 3 - Black & Green", miles:28, max:300 },
];

function Bar({current,max,color,h=8,border}){
  const pct=max>0?Math.min((current/max)*100,100):0;
  return <div style={{background:border||"#1e2d3d",borderRadius:h/2,height:h,width:"100%",overflow:"hidden"}}>
    <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:h/2,transition:"width 0.5s ease"}}/>
  </div>;
}

function ShoeBar({miles,max=300,border}){
  const m=max>0?max:300;
  const pct=(miles/m)*100;
  const color=pct>80?B.coral:pct>60?B.gold:B.green;
  return <Bar current={miles} max={m} color={color} h={4} border={border}/>;
}

function Gauge({value,size=80,trackColor="#1e2d3d",textColor="#e2e8f0",dimColor="#64748b"}){
  const pct=Math.min(value/60,1),ang=-135+(pct*270),r=42,cx=50,cy=50;
  const rad=d=>(d*Math.PI)/180;
  const arc=(s,e)=>{const sa=rad(s-90),ea=rad(e-90);return`M ${cx+r*Math.cos(sa)} ${cy+r*Math.sin(sa)} A ${r} ${r} 0 ${e-s>180?1:0} 1 ${cx+r*Math.cos(ea)} ${cy+r*Math.sin(ea)}`;};
  return <svg width={size} height={size} viewBox="0 0 100 100">
    <path d={arc(-135,135)} fill="none" stroke={trackColor} strokeWidth="6" strokeLinecap="round"/>
    <path d={arc(-135,ang)} fill="none" stroke={B.green} strokeWidth="6" strokeLinecap="round"/>
    <text x="50" y="47" textAnchor="middle" fill={textColor} fontSize="24" fontWeight="700" fontFamily={fontStack}>{value}</text>
    <text x="50" y="64" textAnchor="middle" fill={dimColor} fontSize="9" fontFamily={fontStack}>VO₂ Max</text>
  </svg>;
}

function DockDay({ d, accent, t, hovIdx, idx, setHov }) {
  const isHov = hovIdx === idx;
  const scale = isHov ? 1.08 : 1;
  const bubbleBase = 24;

  return <div
    onMouseEnter={() => setHov(idx)}
    onMouseLeave={() => setHov(null)}
    style={{
      textAlign:"center", flex:1, padding:"10px 0",
      background: d.today ? accent + "12" : "transparent",
      borderRadius: 10,
      border: d.today ? `1px solid ${accent}25` : `1px solid ${t.border}`,
      transform: `scale(${scale})`,
      transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      cursor: "default",
      zIndex: isHov ? 2 : 1,
    }}>
    <div style={{fontSize:14,color:t.dim,fontWeight:500,letterSpacing:"0.02em"}}>{d.day}</div>
    <div style={{fontSize:15,color:t.dimBright,marginBottom:8}}>{d.date}</div>
    <div style={{
      width: bubbleBase, height: bubbleBase, borderRadius:"50%",
      background: d.miles > 0 ? accent : "transparent",
      border: d.miles > 0 ? "none" : `2px solid ${d.today ? accent + "88" : t.dim + "55"}`,
      margin:"0 auto 6px",
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow: d.miles > 0 ? `0 0 12px ${accent}33` : "none",
      transition: "all 0.2s ease",
    }}/>
    {d.miles > 0 && <div style={{fontSize:14,fontWeight:600,color:t.text}}>{d.miles} mi</div>}
  </div>;
}

function LoadingCard({ t, rows = 3, label = "Loading..." }) {
  return <div style={{background:t.card,borderRadius:14,padding:20,border:`1px solid ${t.border}`}}>
    <div style={{fontSize:13,color:t.dim,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:14}}>{label}</div>
    {Array.from({length:rows}).map((_,i)=><div key={i} style={{height:12,borderRadius:6,marginBottom:10,width:`${50+i*12}%`,backgroundSize:"200% 100%",backgroundImage:`linear-gradient(90deg,${t.border}55 25%,${t.border}88 50%,${t.border}55 75%)`,animation:"shimmer 1.5s infinite"}}/>)}
  </div>;
}

// ---------------------------------------------------------------------------
// Polyline decoder (Google Encoded Polyline Algorithm)
// ---------------------------------------------------------------------------
function decodePolyline(encoded) {
  const points = [];
  let idx = 0, lat = 0, lng = 0;
  while (idx < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Checkered finish icon (canvas-based, Strava style)
function _finishIcon(size) {
  const cv = document.createElement("canvas");
  cv.width = size; cv.height = size;
  const ctx = cv.getContext("2d");
  const r = size / 2;
  ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  const cells = 4, cs = size / cells;
  for (let row = 0; row < cells; row++)
    for (let col = 0; col < cells; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#fff" : "#222";
      ctx.fillRect(col * cs, row * cs, cs, cs);
    }
  ctx.beginPath(); ctx.arc(r, r, r - 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
  return L.icon({ iconUrl: cv.toDataURL(), iconSize: [size, size], iconAnchor: [r, r] });
}

const OSM_TILE = "https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png";
const SAT_TILE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ROUTE_COLOR = "#FC4C02";

// ---------------------------------------------------------------------------
// RouteMap — renders a Leaflet map into a div via useEffect
// ---------------------------------------------------------------------------
function RouteMap({ polyline, t, width, height, interactive, onExpand }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !polyline || typeof L === "undefined") return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const points = decodePolyline(polyline);
    if (points.length < 2) return;

    const map = L.map(ref.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: !!interactive,
      scrollWheelZoom: !!interactive,
      doubleClickZoom: !!interactive,
      touchZoom: !!interactive,
      boxZoom: false,
      keyboard: false,
    });
    mapRef.current = map;

    L.tileLayer(OSM_TILE, { maxZoom: 19 }).addTo(map);

    L.polyline(points, { color: ROUTE_COLOR, weight: 3.5, opacity: 0.95 }).addTo(map);

    // Start marker (green circle)
    L.circleMarker(points[0], { radius: 5, fillColor: "#06d6a0", fillOpacity: 1, color: "#fff", weight: 1.5 }).addTo(map);
    // Finish marker (checkered)
    L.marker(points[points.length - 1], { icon: _finishIcon(14) }).addTo(map);

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [12, 12], animate: false });

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [polyline, interactive]);

  return <div style={{ width, height, borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}`, cursor: onExpand ? "pointer" : "default", background: "#e8e0d8" }}
    onClick={onExpand ? (e) => { e.stopPropagation(); onExpand(); } : undefined}>
    <div ref={ref} style={{ width: "100%", height: "100%" }} />
  </div>;
}

// ---------------------------------------------------------------------------
// MapModal — fullscreen interactive map with tile toggle
// ---------------------------------------------------------------------------
function MapModal({ polyline, accent, t, onClose }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const [satellite, setSatellite] = useState(false);
  const tileRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !polyline || typeof L === "undefined") return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const points = decodePolyline(polyline);
    if (points.length < 2) return;

    const map = L.map(ref.current, {
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    });
    mapRef.current = map;

    tileRef.current = L.tileLayer(satellite ? SAT_TILE : OSM_TILE, { maxZoom: 19 }).addTo(map);

    L.polyline(points, { color: ROUTE_COLOR, weight: 4, opacity: 0.95 }).addTo(map);
    // Start marker (green circle)
    L.circleMarker(points[0], { radius: 7, fillColor: "#06d6a0", fillOpacity: 1, color: "#fff", weight: 2 }).addTo(map);
    // Finish marker (checkered)
    L.marker(points[points.length - 1], { icon: _finishIcon(18) }).addTo(map);

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], animate: false });

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [polyline]);

  // Toggle tile layer
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    tileRef.current.setUrl(satellite ? SAT_TILE : OSM_TILE);
  }, [satellite]);

  return <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(6px)" }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background: t.card, borderRadius: 16, padding: 16, width: "min(90vw,800px)", border: `1px solid ${t.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setSatellite(false)} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: !satellite ? accent : "transparent", color: !satellite ? "#fff" : t.dim, fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: fontStack }}>Standard</button>
          <button onClick={() => setSatellite(true)} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: satellite ? accent : "transparent", color: satellite ? "#fff" : t.dim, fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: fontStack }}>Satellite</button>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: t.dim, fontSize: 22, cursor: "pointer", padding: "0 4px", fontFamily: fontStack, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}`, background: "#e8e0d8" }}>
        <div ref={ref} style={{ width: "100%", height: "min(70vh,550px)" }} />
      </div>
    </div>
  </div>;
}

const APP_MODE = window.__APP_MODE__ || "development";

function App(){
  const [themeKey,setThemeKey]=useState("ocean");
  const [showThemes,setShowThemes]=useState(false);
  const [acts,setActs]=useState(ACTIVITIES);
  const [showPlan,setShowPlan]=useState(false);
  const [loc,setLoc]=useState("Concord");
  const [showMore,setShowMore]=useState(false);
  const [vo2,setVo2]=useState(52);
  const [editVo2,setEditVo2]=useState(false);
  const [plan,setPlan]=useState(PLAN_DEFAULTS);
  const [tmp,setTmp]=useState(null);
  const [showAllShoes,setShowAllShoes]=useState(false);
  const [hovDay,setHovDay]=useState(null);
  const [mapModal,setMapModal]=useState(null);
  const [editGoal,setEditGoal]=useState(false);
  const [goalInput,setGoalInput]=useState("");
  const [expandedNotes,setExpandedNotes]=useState({});

  const [favoriteShoes,setFavoriteShoes]=useState([]);

  // ── Live data & loading state ──
  const [demoMode,setDemoMode]=useState(APP_MODE!=="personal");
  const [connected,setConnected]=useState(false);
  const [liveProfile,setLiveProfile]=useState(null);
  const [liveActivities,setLiveActivities]=useState(null);
  const [liveWeekDays,setLiveWeekDays]=useState(null);
  const [liveTotalMi,setLiveTotalMi]=useState(0);
  const [liveGoalMi,setLiveGoalMi]=useState(50);
  const [livePastWeeks,setLivePastWeeks]=useState(null);
  const [loadingProfile,setLoadingProfile]=useState(false);
  const [loadingActivities,setLoadingActivities]=useState(false);
  const [loadingWeeks,setLoadingWeeks]=useState(false);
  const [apiError,setApiError]=useState(null);
  const [actPage,setActPage]=useState(1);
  const [loadingMore,setLoadingMore]=useState(false);
  const [hasMore,setHasMore]=useState(true);
  const [liveWeather,setLiveWeather]=useState(null);
  const [loadingWeather,setLoadingWeather]=useState(false);
  const [assistantMsg,setAssistantMsg]=useState(null);
  const [loadingAssistant,setLoadingAssistant]=useState(false);

  // Fetch live data when switching to live mode
  useEffect(()=>{
    if(demoMode)return;
    setApiError(null);
    fetch("/api/status").then(r=>r.json()).then(d=>{setConnected(d.connected);if(d.settings&&d.settings.favoriteShoes)setFavoriteShoes(d.settings.favoriteShoes);}).catch(()=>setConnected(false));
    setLoadingProfile(true);
    fetch("/api/profile").then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(d=>{if(d.error)throw new Error(d.error);setLiveProfile(d);})
      .catch(e=>setApiError(p=>(p?p+"; ":"")+"Profile: "+e.message))
      .finally(()=>setLoadingProfile(false));
    setLoadingActivities(true);
    fetch("/api/activities").then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(d=>{if(d.error)throw new Error(d.error);setLiveActivities(d.activities);setLiveWeekDays(d.weekDays);setLiveTotalMi(d.totalMi);setLiveGoalMi(d.goalMi);})
      .catch(e=>setApiError(p=>(p?p+"; ":"")+"Activities: "+e.message))
      .finally(()=>setLoadingActivities(false));
    setLoadingWeeks(true);
    fetch("/api/weeks").then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(d=>{if(d.error)throw new Error(d.error);setLivePastWeeks(d.weeks);})
      .catch(e=>setApiError(p=>(p?p+"; ":"")+"Weeks: "+e.message))
      .finally(()=>setLoadingWeeks(false));
  },[demoMode]);

  // Sync activities state when mode or live data changes
  useEffect(()=>{
    if(demoMode){setActs(ACTIVITIES);setActPage(1);setHasMore(true);}
    else if(liveActivities)setActs(liveActivities);
  },[demoMode,liveActivities]);

  // Infinite scroll — load more activities
  const loadMoreActivities=useCallback(()=>{
    if(demoMode||loadingMore||!hasMore)return;
    const nextPage=actPage+1;
    setLoadingMore(true);
    fetch(`/api/activities?page=${nextPage}`).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(d=>{
        if(d.error)throw new Error(d.error);
        const newActs=d.activities||[];
        if(newActs.length===0){setHasMore(false);return;}
        setActs(prev=>{const ids=new Set(prev.map(a=>a.id));const unique=newActs.filter(a=>!ids.has(a.id));return[...prev,...unique];});
        setActPage(nextPage);
        if(newActs.length<10)setHasMore(false);
      })
      .catch(e=>setApiError(p=>(p?p+"; ":"")+"Load more: "+e.message))
      .finally(()=>setLoadingMore(false));
  },[demoMode,loadingMore,hasMore,actPage]);

  // Scroll listener for infinite scroll
  useEffect(()=>{
    const onScroll=()=>{
      if(demoMode||loadingMore||!hasMore)return;
      const scrollBottom=window.innerHeight+window.scrollY;
      const docHeight=document.documentElement.scrollHeight;
      if(docHeight-scrollBottom<400)loadMoreActivities();
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[demoMode,loadingMore,hasMore,loadMoreActivities]);

  // Fetch weather (both demo + live — live weather enhances demo too)
  useEffect(()=>{
    setLoadingWeather(true);
    fetch(`/api/weather?location=${loc.toLowerCase()}`).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(d=>{if(d.error)throw new Error(d.error);setLiveWeather(d.hours);})
      .catch(()=>{setLiveWeather(null);})
      .finally(()=>setLoadingWeather(false));
  },[demoMode,loc]);

  // Fetch AI assistant message (both demo + live — demo sends demo context)
  useEffect(()=>{
    setLoadingAssistant(true);
    const url=demoMode?"/api/assistant?demo=1":"/api/assistant";
    fetch(url).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(d=>{if(d.error)throw new Error(d.error);setAssistantMsg(d.message);})
      .catch(()=>{setAssistantMsg(null);})
      .finally(()=>setLoadingAssistant(false));
  },[demoMode]);

  const t=THEMES[themeKey];
  const accent=t.accent;
  const accent2=t.accent2||t.accent;
  const totalMi=demoMode?26.2:liveTotalMi, goalMi=demoMode?50:liveGoalMi;
  const resolvedWeekDays=demoMode?WEEK_DAYS:(liveWeekDays||WEEK_DAYS);
  const resolvedPastWeeks=demoMode?PAST_WEEKS:(livePastWeeks||PAST_WEEKS);
  const resolvedShoes=demoMode?ALL_SHOES:(liveProfile?liveProfile.shoes:ALL_SHOES);
  const resolvedName=demoMode?"Raoul Kahn":(liveProfile?liveProfile.name:"\u2014");
  const resolvedLocation=demoMode?"Concord, CA":(liveProfile?[liveProfile.city,liveProfile.state].filter(Boolean).join(", "):"\u2014");
  const resolvedYtdMiles=demoMode?198.7:(liveProfile?liveProfile.ytd_miles:0);
  const resolvedWeather=liveWeather||WEATHER;

  // Current week boundaries (shared by plan counts + RunTypePill rules)
  const _now=new Date(),_dow=_now.getDay();
  const weekMon=new Date(_now);weekMon.setDate(_now.getDate()-(_dow===0?6:_dow-1));weekMon.setHours(0,0,0,0);
  const weekSun=new Date(weekMon);weekSun.setDate(weekMon.getDate()+6);weekSun.setHours(23,59,59,999);
  const isThisWeek=(a)=>{
    if(!a.start_date_local)return false;
    const d=new Date(a.start_date_local.replace("Z",""));
    return d>=weekMon&&d<=weekSun;
  };

  // Count runTypes from current week activities only
  const runTypeCounts=(()=>{
    const counts={};
    acts.forEach(a=>{if(a.runType&&isThisWeek(a))counts[a.runType]=(counts[a.runType]||0)+1;});
    return counts;
  })();

  const toggleFavorite=(shoeId)=>{
    const id=shoeId||"";
    const next=favoriteShoes.includes(id)?favoriteShoes.filter(s=>s!==id):[...favoriteShoes,id];
    setFavoriteShoes(next);
    if(!demoMode)fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({favoriteShoes:next})}).catch(()=>{});
  };
  const sortedShoes=[...resolvedShoes].sort((a,b)=>{
    const aFav=favoriteShoes.includes(a.id||a.name);
    const bFav=favoriteShoes.includes(b.id||b.name);
    if(aFav&&!bFav)return -1;
    if(!aFav&&bFav)return 1;
    if(aFav&&bFav)return(a.name||"").localeCompare(b.name||"");
    return (b.miles||0)-(a.miles||0);
  });

  const crd={background:t.card,borderRadius:14,padding:20,border:`1px solid ${t.border}`,transition:"background 0.2s",minWidth:0,overflow:"hidden"};
  const lbl={fontSize:14,color:t.dim,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:0,fontFamily:fontStack};

  const rtColor=(name)=>{
    const rt=RUN_TYPES.find(r=>r.name===name);
    if(!rt)return t.dim;
    return rt.color==="ACCENT"?accent:rt.color;
  };

  const RunTypePill=({type,actId})=>{
    const [open,setOpen]=useState(false);
    const color=type?rtColor(type):accent;
    return <div style={{position:"relative",display:"inline-block"}}>
      <button onClick={e=>{e.stopPropagation();setOpen(!open);}} style={{
        display:"inline-flex",alignItems:"center",gap:4,padding:"3px 12px",borderRadius:20,fontSize:14,fontWeight:600,
        background:type?color+"18":"transparent",color:type?color:accent,
        border:type?`1px solid ${color}33`:`1px dashed ${accent}55`,
        cursor:"pointer",fontStyle:type?"normal":"italic",fontFamily:fontStack,
        transition:"all 0.15s",
      }}>{type||"Select type..."}</button>
      {open&&<div style={{position:"absolute",top:30,left:0,background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:6,zIndex:500,boxShadow:"0 12px 32px rgba(0,0,0,0.5)",width:190,backdropFilter:"blur(8px)"}} onClick={e=>e.stopPropagation()}>
        {RUN_TYPES.map(rt=>{const c=rt.color==="ACCENT"?accent:rt.color;
          return <button key={rt.name} onClick={e=>{e.stopPropagation();setActs(p=>p.map(x=>x.id===actId?{...x,runType:rt.name}:x));setOpen(false);if(!demoMode)fetch(`/api/activities/${actId}/runtype`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({runType:rt.name})}).catch(()=>{});}} style={{
            display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 10px",
            background:type===rt.name?c+"18":"transparent",border:"none",borderRadius:6,
            cursor:"pointer",color:t.text,fontSize:14,fontFamily:fontStack,
            transition:"background 0.15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.background=c+"12"}
          onMouseLeave={e=>e.currentTarget.style.background=type===rt.name?c+"18":"transparent"}
          ><div style={{width:8,height:8,borderRadius:"50%",background:c}}/>{rt.name}</button>;})}
        {type&&<><div style={{height:1,background:t.border+"44",margin:"4px 6px"}}/><button onClick={e=>{e.stopPropagation();setActs(p=>p.map(x=>x.id===actId?{...x,runType:null}:x));setOpen(false);if(!demoMode)fetch(`/api/activities/${actId}/runtype`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({runType:null})}).catch(()=>{});}} style={{
            display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 10px",
            background:"transparent",border:"none",borderRadius:6,
            cursor:"pointer",color:B.coral,fontSize:14,fontFamily:fontStack,
            transition:"background 0.15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.background=B.coral+"12"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >Clear type</button></>}
      </div>}
    </div>;
  };

  const visibleShoes = showAllShoes ? sortedShoes : sortedShoes.slice(0,5);

  return <div style={{background:t.bg,minHeight:"100vh",color:t.text,fontFamily:fontStack,transition:"background 0.35s ease"}}>
  <div style={{maxWidth:1200,margin:"0 auto",padding:"28px 36px"}}>

    {/* Google Fonts */}
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}} @keyframes spin{to{transform:rotate(360deg)}} .weather-scroll::-webkit-scrollbar{width:4px} .weather-scroll::-webkit-scrollbar-track{background:transparent} .weather-scroll::-webkit-scrollbar-thumb{background:${t.border};border-radius:4px} .leaflet-container{background:#e6e5e3!important} .splits-scroll::-webkit-scrollbar{width:4px} .splits-scroll::-webkit-scrollbar-track{background:transparent} .splits-scroll::-webkit-scrollbar-thumb{background:${t.border};border-radius:4px}`}</style>

    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:42,height:42,borderRadius:12,background:accent+"15",border:`1px solid ${accent}22`}}>
          <PulseIcon size={22} color={accent}/>
        </div>
        <div>
          <h1 style={{margin:0,fontSize:30,fontWeight:700,letterSpacing:"-0.02em"}}>Running Dashboard</h1>
          <div style={{fontSize:16,color:t.dim,marginTop:3,fontWeight:500}}>{demoMode?(APP_MODE==="demo"?"Interactive demo":"Demo mode \u2014 sample data"):connected?"Live from Strava":"Connecting to Strava\u2026"}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:14,alignItems:"center"}}>
        {APP_MODE==="development"&&<button onClick={()=>{setDemoMode(d=>!d);setApiError(null);}} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,background:demoMode?accent:t.card,border:`1px solid ${demoMode?accent:t.border}`,fontSize:14,color:demoMode?"#fff":t.dim,fontWeight:600,letterSpacing:"0.05em",cursor:"pointer",fontFamily:fontStack,transition:"all 0.2s"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:demoMode?"#fff":B.green}}/>
          {demoMode?"DEMO":"LIVE"}
        </button>}
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowThemes(!showThemes)} style={{width:38,height:38,borderRadius:10,border:`1px solid ${t.border}`,background:t.card,cursor:"pointer",display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,padding:8,transition:"border-color 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=accent}
            onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}
            title="Change theme">
            {[THEMES.ocean.swatch,THEMES.strava.swatch,THEMES.oceanLight.swatch,THEMES.forest.swatch].map((c,i)=>
              <div key={i} style={{width:8,height:8,borderRadius:"50%",background:c}}/>
            )}
          </button>
          {showThemes&&<div style={{position:"absolute",top:42,right:0,background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:10,boxShadow:"0 16px 48px rgba(0,0,0,0.6)",zIndex:100,width:185}}>
            {(()=>{const darkKeys=["ocean","strava","forest","midnight","slate"];const lightKeys=["minimalGray","oceanLight","forestLight","sunsetLight","stravaLight"];const renderBtn=(key,th)=>(
              <button key={key} onClick={()=>{setThemeKey(key);setShowThemes(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 8px",borderRadius:8,border:"none",background:themeKey===key?th.accent+"18":"transparent",cursor:"pointer",transition:"background 0.15s"}}
                onMouseEnter={e=>{if(themeKey!==key)e.currentTarget.style.background=th.accent+"10";}}
                onMouseLeave={e=>{if(themeKey!==key)e.currentTarget.style.background="transparent";}}>
                <div style={{display:"flex",gap:3,alignItems:"center"}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:th.accent,border:themeKey===key?`2px solid ${t.text}`:"2px solid transparent",transition:"border 0.15s"}}/>
                  <div style={{width:8,height:8,borderRadius:"50%",background:th.accent2||th.accent,opacity:0.7}}/>
                </div>
                <span style={{fontSize:15,color:themeKey===key?t.text:t.dim,fontWeight:themeKey===key?600:400,fontFamily:fontStack}}>{th.name}</span>
              </button>);return<>
              <div style={{fontSize:11,fontWeight:700,color:t.dim,textTransform:"uppercase",letterSpacing:"0.1em",padding:"6px 8px 4px",opacity:0.7}}>Dark</div>
              {darkKeys.map(k=>renderBtn(k,THEMES[k]))}
              <div style={{height:1,background:t.border,margin:"6px 6px"}}/>
              <div style={{fontSize:11,fontWeight:700,color:t.dim,textTransform:"uppercase",letterSpacing:"0.1em",padding:"6px 8px 4px",opacity:0.7}}>Light</div>
              {lightKeys.map(k=>renderBtn(k,THEMES[k]))}
            </>;})()}
          </div>}
        </div>
      </div>
    </div>

    {/* Error banner */}
    {apiError&&<div style={{background:"#ff6b6b14",border:"1px solid #ff6b6b33",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:15,color:B.coral}}>{apiError}</span>
      <button onClick={()=>setApiError(null)} style={{background:"none",border:"none",color:B.coral,cursor:"pointer",fontSize:18,padding:"0 4px",fontFamily:fontStack}}>×</button>
    </div>}

    {/* Strava connect CTA */}
    {!demoMode&&!connected&&!loadingProfile&&!apiError&&<div style={{...crd,textAlign:"center",padding:"32px 20px",marginBottom:16,borderColor:accent+"30"}}>
      <div style={{fontSize:17,fontWeight:600,marginBottom:8}}>Connect your Strava account</div>
      <div style={{fontSize:15,color:t.dim,marginBottom:16}}>Authorize with Strava to see your live running data</div>
      <a href="/auth/strava" style={{display:"inline-block",padding:"12px 28px",background:"#fc4c02",color:"#fff",textDecoration:"none",borderRadius:10,fontWeight:700,fontSize:16}}>Connect with Strava</a>
    </div>}

    {/* Main Grid */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20}}>

      {/* LEFT */}
      <div style={{display:"flex",flexDirection:"column",gap:20,minWidth:0}}>

        {/* AI Assistant */}
        {loadingAssistant?<LoadingCard t={t} rows={2} label="AI ASSISTANT"/>:<div style={{...crd,background:`linear-gradient(135deg,${t.card},${t.card2})`,borderColor:accent2+"30"}}>
          <div style={{...lbl,marginBottom:8}}>AI ASSISTANT</div>
          <div style={{fontSize:18,lineHeight:1.6,fontWeight:400,color:t.text+"ee"}}>
            {assistantMsg||"You've logged 26.2 of your 50-mile goal this week with 3 runs in the books. It's clearing up to 58\u00b0F and sunny by noon \u2014 a good window for that interval run you still have on the plan. An 8-miler today would keep you right on pace heading into the weekend."}
          </div>
        </div>}

        {/* Weekly Goal */}
        {!demoMode&&loadingActivities?<LoadingCard t={t} rows={5} label="WEEKLY GOAL"/>:<div style={crd}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={lbl}>WEEKLY GOAL</span>
              {goalMi>0?<button onClick={()=>{setGoalInput(String(goalMi));setEditGoal(true);}} style={{background:"none",border:"none",color:accent,fontSize:13,cursor:"pointer",fontWeight:600,fontFamily:fontStack}}>Edit</button>
              :<button onClick={()=>{setGoalInput("");setEditGoal(true);}} style={{background:"none",border:"none",color:accent,fontSize:13,cursor:"pointer",fontWeight:600,fontFamily:fontStack}}>+ Set Weekly Goal</button>}
            </div>
            {goalMi>0&&<div style={{fontSize:26,fontWeight:700,letterSpacing:"-0.02em"}}>{totalMi} <span style={{color:t.dim,fontWeight:400,fontSize:17}}>/ {goalMi} mi</span></div>}
          </div>
          {editGoal&&(()=>{const saveGoal=()=>{const v=parseFloat(goalInput)||0;if(demoMode){setEditGoal(false);return;}fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({goalMi:v})}).then(()=>{setLiveGoalMi(v);setEditGoal(false);setLoadingAssistant(true);fetch("/api/assistant?refresh=1").then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}).then(d=>{if(d.error)throw new Error(d.error);setAssistantMsg(d.message);}).catch(()=>{}).finally(()=>setLoadingAssistant(false));}).catch(()=>{});};return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <input type="number" value={goalInput} onChange={e=>setGoalInput(e.target.value)} placeholder="Miles" min="0" style={{width:80,padding:"6px 10px",borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text,fontSize:15,fontFamily:fontStack,outline:"none"}} autoFocus onKeyDown={e=>{if(e.key==="Enter")saveGoal();if(e.key==="Escape")setEditGoal(false);}}/>
            <span style={{fontSize:14,color:t.dim}}>mi</span>
            <button onClick={saveGoal} style={{padding:"6px 14px",borderRadius:8,border:"none",background:accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:fontStack}}>Save</button>
            <button onClick={()=>setEditGoal(false)} style={{background:"none",border:"none",color:t.dim,fontSize:13,cursor:"pointer",fontFamily:fontStack}}>Cancel</button>
          </div>;})()}
          {goalMi>0&&<Bar current={totalMi} max={goalMi} color={accent} border={t.border}/>}

          <div style={{display:"flex",justifyContent:"space-between",marginTop:22,gap:4}}>
            {resolvedWeekDays.map((d,i)=><DockDay key={d.day} d={d} accent={accent} t={t} hovIdx={hovDay} idx={i} setHov={setHovDay}/>)}
          </div>

          <div style={{textAlign:"center",marginTop:14}}>
            <button onClick={()=>setShowMore(!showMore)} style={{background:"none",border:`1px solid ${t.border}`,borderRadius:8,color:accent,fontSize:14,padding:"7px 20px",cursor:"pointer",fontWeight:600,fontFamily:fontStack,transition:"border-color 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
              {showMore?"Hide":"Show More"} {showMore?"▲":"▼"}
            </button>
          </div>

          {showMore&&(!demoMode&&loadingWeeks?<LoadingCard t={t} rows={3} label="PAST WEEKS"/>:resolvedPastWeeks.map((w,i)=><div key={i} style={{marginTop:i===0?16:0,padding:"14px 0",borderTop:`1px solid ${t.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:16,fontWeight:600}}>{w.label}</span>
              <span style={{fontSize:15,color:t.dim,fontWeight:500}}>{w.miles} mi · {w.time}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",gap:4}}>
              {w.days.map((d,j)=><div key={j} style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:13,color:t.dim,fontWeight:500}}>{d.d}</div>
                <div style={{width:18,height:18,borderRadius:"50%",background:d.mi>0?accent2+"77":"transparent",border:d.mi>0?"none":`1px solid ${t.dim}44`,margin:"5px auto"}}/>
                {d.mi>0&&<div style={{fontSize:13,color:t.dimBright}}>{d.mi}</div>}
              </div>)}
            </div>
          </div>))}
        </div>}

        {/* Activity Feed */}
        {!demoMode&&loadingActivities?<LoadingCard t={t} rows={5} label="RECENT ACTIVITIES"/>:<div>
          <div style={{...lbl,marginBottom:14}}>RECENT ACTIVITIES</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {acts.map(a=><div key={a.id} style={{...crd,transition:"border-color 0.2s, background 0.2s"}}>
              {/* Line 1: Title + RunType */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:18,letterSpacing:"-0.01em"}}>{a.title}</span>
                {isThisWeek(a)?<RunTypePill type={a.runType} actId={a.id}/>:a.runType?<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 12px",borderRadius:20,fontSize:14,fontWeight:600,background:rtColor(a.runType)+"18",color:rtColor(a.runType),border:`1px solid ${rtColor(a.runType)}33`,fontFamily:fontStack}}>{a.runType}</span>:null}
              </div>
              {/* Line 2: Time · Date · Device · Shoe · City */}
              <div style={{fontSize:14,color:t.dim,marginBottom:14,fontWeight:500}}>{[a.date,a.device,a.shoe,a.city].filter(Boolean).join(" · ")}</div>
              {/* Line 3: Stats row — evenly spaced */}
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"8px 0"}}>
                {[{l:"Distance",v:a.distance},{l:"Pace",v:a.pace},{l:"Moving Time",v:a.time},{l:"Elevation",v:a.elev},{l:"Calories",v:a.cal||"\u2014"},{l:"Relative Effort",v:a.eff!=null?a.eff:"\u2014"}].map(s=><div key={s.l} style={{textAlign:"center"}}>
                  <div style={{fontSize:19,fontWeight:700,letterSpacing:"-0.02em"}}>{s.v}</div>
                  <div style={{fontSize:13,color:t.dim,fontWeight:500,marginTop:2}}>{s.l}</div>
                </div>)}
              </div>

              {/* Notes (if description exists) */}
              {a.description&&<div style={{marginTop:14}}>
                <div style={{...lbl,marginBottom:6}}>NOTES</div>
                {expandedNotes[a.id]?<>
                  <div style={{fontSize:14,color:t.dimBright,lineHeight:1.5}}>{a.description}</div>
                  <span onClick={()=>setExpandedNotes(p=>({...p,[a.id]:false}))} style={{fontSize:13,color:accent,fontWeight:700,cursor:"pointer",marginTop:4,display:"inline-block"}}>Show less</span>
                </>:<div style={{fontSize:14,color:t.dimBright,lineHeight:1.5,display:"flex"}}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{a.description}</span>
                  {a.description.length>80&&<span onClick={()=>setExpandedNotes(p=>({...p,[a.id]:true}))} style={{fontSize:13,color:accent,fontWeight:700,cursor:"pointer",flexShrink:0,marginLeft:6}}>Show more</span>}
                </div>}
              </div>}

              {/* Bottom: Splits + Route Map side by side */}
              <div style={{marginTop:18,paddingTop:18,borderTop:`1px solid ${t.border}`}}>
                <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:10}}>
                  <div>
                    <div style={{...lbl,marginBottom:10}}>SPLITS</div>
                    <div style={{fontSize:15,paddingRight:20}}>
                      <div style={{display:"flex",padding:"6px 0",borderBottom:`1px solid ${t.border}`,fontWeight:600,color:t.dim}}>
                        <span style={{width:40}}>Mile</span><span style={{width:80}}>Pace</span><span style={{width:70,textAlign:"right"}}>Elevation</span>
                      </div>
                      <div className="splits-scroll" style={{maxHeight:264,overflowY:(a.splits||[]).length>8?"auto":"visible",scrollbarWidth:"thin",scrollbarColor:`${t.border} transparent`}}>
                        {(a.splits||[]).map((s,si)=>{
                          const isLast=si===(a.splits||[]).length-1;
                          const isPartial=s.dist&&s.dist<1500&&isLast;
                          // Hide GPS noise: final split < 0.1 mi (~161m)
                          if(isLast&&s.dist&&s.dist<161)return null;
                          const partialMi=isPartial?((s.dist||0)*0.000621371).toFixed(2):null;
                          const partialPace=isPartial&&s.moving_time&&s.dist?(()=>{const spm=1609.34/(s.dist/s.moving_time);const m=Math.floor(spm/60);const sc=Math.floor(spm%60);return`${m}:${sc<10?"0":""}${sc}`;})():null;
                          return <div key={s.m} style={{display:"flex",padding:"6px 0",borderBottom:`1px solid ${t.border}18`,opacity:isPartial?0.6:1}}>
                            <span style={{width:40,color:t.dim,fontStyle:isPartial?"italic":"normal"}}>{isPartial?partialMi:s.m}</span>
                            <span style={{width:80,fontWeight:500,fontStyle:isPartial?"italic":"normal"}}>{isPartial&&partialPace?partialPace:(s.p||"\u2014")} /mi</span>
                            <span style={{width:70,textAlign:"right",color:t.dim}}>{s.e||"\u2014"}</span>
                          </div>;
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{...lbl,marginBottom:10}}>ROUTE MAP</div>
                    {a.polyline?
                      <RouteMap polyline={a.polyline} t={t} width="100%" height={300} onExpand={()=>setMapModal(a.polyline)} />
                    :<div style={{background:t.input,borderRadius:10,height:300,display:"flex",alignItems:"center",justifyContent:"center",color:t.dim,fontSize:15,border:`1px solid ${t.border}`,fontWeight:500}}>
                      <MapPinIcon size={20} color={t.dim}/><span style={{marginLeft:8}}>No route data</span>
                    </div>}
                  </div>
                </div>
              </div>
            </div>)}
          </div>
          {!demoMode&&loadingMore&&<div style={{textAlign:"center",padding:"20px 0"}}><div style={{display:"inline-block",width:24,height:24,border:`3px solid ${t.border}`,borderTopColor:accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>}
          {!demoMode&&!hasMore&&acts.length>10&&<div style={{textAlign:"center",padding:"14px 0",fontSize:14,color:t.dim,fontWeight:500}}>No more activities</div>}
        </div>}
      </div>

      {/* RIGHT SIDEBAR */}
      <div style={{display:"flex",flexDirection:"column",gap:20}}>

        {/* Profile + Predictions */}
        {!demoMode&&loadingProfile?<LoadingCard t={t} rows={3} label="PROFILE"/>:<div style={{...crd,padding:"14px 20px",transition:"background 0.2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:20,letterSpacing:"-0.01em"}}>{resolvedName}</div>
              <div style={{fontSize:15,color:accent2,marginTop:3,fontWeight:500,opacity:0.7}}>{resolvedLocation}</div>
              <div style={{fontSize:14,color:t.dim,marginTop:5}}>2026 Total: <span style={{color:t.text,fontWeight:600}}>{resolvedYtdMiles} mi</span></div>
            </div>
            <div style={{textAlign:"center",flexShrink:0}}>
              {editVo2?<div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"center"}}>
                <input type="number" value={vo2} onChange={e=>setVo2(Number(e.target.value))} style={{width:50,background:t.input,border:`1px solid ${t.border}`,borderRadius:6,color:t.text,padding:"5px",fontSize:16,textAlign:"center",fontFamily:fontStack}}/>
                <button onClick={()=>setEditVo2(false)} style={{background:B.green,border:"none",borderRadius:6,color:"#0b1219",padding:"4px 12px",fontSize:12,cursor:"pointer",fontWeight:700}}>Save</button>
              </div>:
              <div onClick={()=>setEditVo2(true)} style={{cursor:"pointer"}} title="Click to edit">
                <Gauge value={vo2} size={78} trackColor={t.border} textColor={t.text} dimColor={t.dim}/>
              </div>}
              <div style={{fontSize:10,color:t.dim,marginTop:-2,opacity:0.5,fontWeight:500}}>Powered by Garmin</div>
            </div>
          </div>
        </div>}

        {/* Weather */}
        <div style={crd}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={lbl}>WEATHER</div>
            <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${t.border}`}}>
              {["Concord","Danville"].map(l=><button key={l} onClick={()=>setLoc(l)} style={{background:loc===l?accent:"transparent",color:loc===l?"#fff":t.dim,border:"none",padding:"5px 14px",fontSize:13,cursor:"pointer",fontWeight:600,fontFamily:fontStack,transition:"all 0.2s"}}>{l}</button>)}
            </div>
          </div>
          {!demoMode&&loadingWeather?<LoadingCard t={t} rows={4} label="Loading forecast..."/>:<div style={{position:"relative"}}>
            <div className="weather-scroll" style={{maxHeight:280,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:`${t.border} transparent`}}>
              {(()=>{const _dn=["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];let lastOff=null;return resolvedWeather.flatMap((w,i)=>{
                const items=[];
                const off=w.dayOffset!=null?w.dayOffset:0;
                if(off!==lastOff){lastOff=off;const label=_dn[(new Date().getDay()+off)%7];items.push(<div key={"dh-"+off} style={{padding:"8px 0 4px",fontSize:12,fontWeight:700,color:accent2,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${t.border}33`}}>{label}</div>);}
                items.push(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${t.border}18`,fontSize:15}}>
                  <span style={{minWidth:56,color:t.dim,fontWeight:500,whiteSpace:"nowrap"}}>{w.time}</span>
                  <span style={{flexShrink:0,width:18,display:"flex",alignItems:"center",justifyContent:"center"}}>{w.type==="sun"?<SunIcon size={16}/>:<CloudSunIcon size={16} bgFill={t.card}/>}</span>
                  <span style={{fontWeight:700,minWidth:38,textAlign:"right",color:w.temp>=45&&w.temp<=70?B.green:B.coral,whiteSpace:"nowrap"}}>{w.temp}°</span>
                  <span style={{minWidth:32,textAlign:"right",color:t.dim,fontSize:13,fontWeight:500,whiteSpace:"nowrap",marginLeft:"auto"}}>{w.rain}</span>
                  <span style={{minWidth:50,textAlign:"right",color:t.dim,fontSize:13,fontWeight:500,whiteSpace:"nowrap"}}>{w.wind}</span>
                </div>);
                return items;
              });})()}
            </div>
            {resolvedWeather.length>6&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:28,background:`linear-gradient(transparent,${t.card})`,pointerEvents:"none",borderRadius:"0 0 12px 12px"}}/>}
          </div>}
        </div>

        {/* Weekly Run Plan */}
        <div style={crd}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={lbl}>WEEKLY RUN PLAN</div>
            <button onClick={()=>{setTmp(plan.map(p=>({...p})));setShowPlan(true);}} style={{background:"none",border:"none",color:accent,fontSize:13,cursor:"pointer",fontWeight:600,fontFamily:fontStack}}>Edit</button>
          </div>
          {(()=>{const totalPlanned=plan.reduce((s,p)=>s+p.count,0);const totalDone=plan.reduce((s,p)=>s+Math.min(runTypeCounts[p.type]||0,p.count),0);const pct=totalPlanned?Math.round((totalDone/totalPlanned)*100):0;return <div style={{marginBottom:14}}>
            <div style={{textAlign:"right",fontSize:13,color:t.dim,fontWeight:500,marginBottom:6}}>{pct}%</div>
            <Bar current={totalDone} max={totalPlanned} color={totalDone>=totalPlanned?B.green:accent} h={6} border={t.border}/>
          </div>;})()}
          {plan.map((p,i)=>{
            const color=rtColor(p.type);
            const completed=runTypeCounts[p.type]||0;
            const done=completed>=p.count;
            return <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${t.border}18`,opacity:done?0.65:1,transition:"opacity 0.2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0,alignSelf:p.notes?"flex-start":"center",marginTop:p.notes?3:0}}/>
                <div>
                  <span style={{fontSize:15,color:done?t.dim:t.text,fontWeight:500}}>{p.type}</span>
                  {p.notes&&<div style={{fontSize:12,color:t.dim,marginTop:1}}>{p.notes}</div>}
                </div>
              </div>
              <span style={{fontSize:14,color:done?t.dim:t.text,fontWeight:600,flexShrink:0,marginLeft:8}}>{completed}/{p.count}</span>
            </div>;
          })}
        </div>

        {/* Shoes */}
        {!demoMode&&loadingProfile?<LoadingCard t={t} rows={4} label="MY SHOES"/>:<div style={crd}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={lbl}>MY SHOES</span>
          </div>
          {visibleShoes.map(s=>{const shoeKey=s.id||s.name;const isFav=favoriteShoes.includes(shoeKey);return <div key={s.name} style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:3,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0,flex:1}}>
                <button onClick={()=>toggleFavorite(shoeKey)} style={{background:"none",border:"none",cursor:"pointer",padding:0,fontSize:16,lineHeight:1,color:isFav?B.gold:t.dim,transition:"color 0.15s",flexShrink:0}} title={isFav?"Remove favorite":"Add favorite"}>{isFav?"★":"☆"}</button>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{s.name}</span>
              </div>
              <span style={{color:t.dim,flexShrink:0,marginLeft:8,fontWeight:500}}>{Math.round(s.miles)}/{s.max} mi</span>
            </div>
            <ShoeBar miles={s.miles} max={s.max} border={t.border}/>
          </div>;})}

          {sortedShoes.length>5&&<div style={{textAlign:"center",marginTop:14}}>
            <button onClick={()=>setShowAllShoes(!showAllShoes)} style={{background:"none",border:`1px solid ${t.border}`,borderRadius:8,color:accent,fontSize:14,padding:"7px 20px",cursor:"pointer",fontWeight:600,fontFamily:fontStack,transition:"border-color 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
              {showAllShoes?"Show Less":"Show All Shoes"} {showAllShoes?"▲":"▼"}
            </button>
          </div>}
        </div>}

      </div>
    </div>

    {/* Plan Modal */}
    {showPlan&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}} onClick={()=>setShowPlan(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:t.card,borderRadius:18,padding:28,width:460,border:`1px solid ${t.border}`,boxShadow:"0 24px 64px rgba(0,0,0,0.6)"}}>
        <h3 style={{margin:"0 0 4px",fontSize:22,fontWeight:700,letterSpacing:"-0.02em"}}>Edit Weekly Run Plan</h3>
        <p style={{margin:"0 0 22px",fontSize:14,color:t.dim,fontWeight:500}}>Set your weekly template. Resets every Monday.</p>
        {tmp&&tmp.map((p,i)=>{
          const color=p.type==="Rest"?t.dim:rtColor(p.type);
          return <div key={i} style={{padding:"12px 0",borderBottom:`1px solid ${t.border}18`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:color}}/>
                <span style={{fontSize:16,fontWeight:500}}>{p.type}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>{const n=[...tmp];n[i]={...n[i],count:Math.max(0,n[i].count-1)};setTmp(n);}} style={{width:30,height:30,borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fontStack,transition:"border-color 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=accent}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>−</button>
                <span style={{width:22,textAlign:"center",fontSize:18,fontWeight:700}}>{p.count}</span>
                <button onClick={()=>{const n=[...tmp];n[i]={...n[i],count:n[i].count+1};setTmp(n);}} style={{width:30,height:30,borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fontStack,transition:"border-color 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=accent}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>+</button>
              </div>
            </div>
            {p.type!=="Rest"&&<input value={p.notes} onChange={e=>{const n=[...tmp];n[i]={...n[i],notes:e.target.value};setTmp(n);}} placeholder="Notes (distance, pace...)" style={{width:"100%",background:t.input,border:`1px solid ${t.border}`,borderRadius:6,color:t.text,padding:"6px 10px",fontSize:14,marginTop:8,boxSizing:"border-box",fontFamily:fontStack,transition:"border-color 0.15s"}}
              onFocus={e=>e.currentTarget.style.borderColor=accent}
              onBlur={e=>e.currentTarget.style.borderColor=t.border}/>}
          </div>;
        })}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"12px 0",borderTop:`1px solid ${t.border}`}}>
          <span style={{fontSize:15,color:t.dim,fontWeight:500}}>Total activities</span>
          <span style={{fontSize:15,fontWeight:700}}>{tmp?.reduce((s,p)=>s+p.count,0)} / week</span>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={()=>setShowPlan(false)} style={{flex:1,padding:"11px 0",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",color:t.text,fontSize:16,cursor:"pointer",fontFamily:fontStack,fontWeight:500,transition:"border-color 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=t.dimBright}
            onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>Cancel</button>
          <button onClick={()=>{setPlan(tmp);setShowPlan(false);}} style={{flex:1,padding:"11px 0",borderRadius:10,border:"none",background:accent,color:"#fff",fontSize:16,cursor:"pointer",fontWeight:700,fontFamily:fontStack,transition:"opacity 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>Save Plan</button>
        </div>
      </div>
    </div>}

    {/* Map Modal */}
    {mapModal&&<MapModal polyline={mapModal} accent={accent} t={t} onClose={()=>setMapModal(null)}/>}
  </div>
  </div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
