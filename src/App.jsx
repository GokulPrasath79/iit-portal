import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

// ─── Constants ───────────────────────────────────────────────────────────────
const SUBJECTS = ["Physics", "Chemistry", "Mathematics"];

const CHAPTERS = {
  Physics: [
    "Units & Measurement","Kinematics","Laws of Motion","Work, Energy & Power",
    "Rotational Motion","Gravitation","Properties of Matter","Thermodynamics",
    "Oscillations","Waves","Electrostatics","Current Electricity",
    "Magnetic Effects","EMI & AC","Optics","Modern Physics","Semiconductors"
  ],
  Chemistry: [
    "Basic Concepts","Atomic Structure","Chemical Bonding","States of Matter",
    "Thermodynamics","Equilibrium","Redox Reactions","Hydrogen","s-Block",
    "p-Block","d & f-Block","Coordination Compounds","Organic Basics",
    "Hydrocarbons","Haloalkanes","Alcohols & Ethers","Aldehydes & Ketones",
    "Amines","Biomolecules","Polymers"
  ],
  Mathematics: [
    "Sets & Relations","Complex Numbers","Quadratic Equations","Sequences & Series",
    "Permutations","Binomial Theorem","Limits & Continuity","Differentiation",
    "Integration","Differential Equations","Coordinate Geometry","Straight Lines",
    "Circles","Conics","3D Geometry","Vectors","Matrices","Probability","Statistics"
  ]
};

const RESOURCE_TYPES = ["NCERT", "Assignments", "Study Material", "PYQs"];
const EXAMS = ["JEE Main", "JEE Advanced", "BITSAT", "VITEEE"];
const SUB_COLOR = { Physics: "#818CF8", Chemistry: "#34D399", Mathematics: "#F59E0B" };

const TABS = [
  { id: "dashboard", icon: "⬡", label: "Dashboard" },
  { id: "tests",     icon: "📊", label: "Test Analysis" },
  { id: "syllabus",  icon: "✅", label: "Syllabus Tracker" },
  { id: "resources", icon: "📚", label: "Resources" },
  { id: "scheduler", icon: "📅", label: "Mock Scheduler" },
  { id: "rank",      icon: "🎯", label: "Rank Predictor" },
  { id: "studyplan", icon: "🗓", label: "Study Plan" },
  { id: "student",   icon: "👤", label: "Student" },
];

const EMPTY_SYLLABUS = Object.fromEntries(
  SUBJECTS.map(s => [s, Array(CHAPTERS[s].length).fill(false)])
);
const EMPTY_RESOURCES = Object.fromEntries(SUBJECTS.map(s => [s, {}]));
const EMPTY_STUDENT = { name: "", class: "Class 12", target: "", school: "", city: "", phone: "", email: "", dob: "" };
const EMPTY_PLAN = {};

// ─── Utilities ────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── UI primitives ───────────────────────────────────────────────────────────
function ScoreRing({ pct, size = 120, stroke = 10, color = "#4F46E5", label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2A45" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease" }}/>
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace" }}>
        <span style={{ fontSize: size*0.22, fontWeight:700, color:"#F1F5F9" }}>{pct}%</span>
        {label && <span style={{ fontSize: size*0.1, color:"#94A3B8", marginTop:2 }}>{label}</span>}
      </div>
    </div>
  );
}

function MiniBar({ value, max = 100, color = "#4F46E5", height = 8 }) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div style={{ background:"#1E2A45", borderRadius:99, height, overflow:"hidden", width:"100%" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color,
        borderRadius:99, transition:"width 0.8s ease" }}/>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background:"#0F1E35", border:"1px solid #1E2A45",
      borderRadius:16, padding:"20px 24px", ...style }}>
      {children}
    </div>
  );
}

function Badge({ label, color = "#4F46E5" }) {
  return (
    <span style={{ background: color+"22", color, border:`1px solid ${color}44`,
      borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:600, letterSpacing:.4 }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function Dashboard({ tests, syllabus, studentInfo }) {
  const latest = tests[tests.length - 1];
  const latestTotal = latest ? latest.physics + latest.chemistry + latest.mathematics : 0;
  const latestPct = latest ? Math.round((latestTotal / latest.maxMarks) * 100) : 0;

  const syllabusTotal = Object.values(syllabus).flat().length;
  const syllabusCompleted = Object.values(syllabus).flat().filter(Boolean).length;
  const syllabusPct = syllabusTotal ? Math.round((syllabusCompleted / syllabusTotal) * 100) : 0;

  const trend = tests.slice(-5).map(t =>
    Math.round(((t.physics + t.chemistry + t.mathematics) / t.maxMarks) * 100));

  const avgScore = tests.length
    ? Math.round(tests.reduce((a,t)=>a+(t.physics+t.chemistry+t.mathematics),0)/tests.length)
    : 0;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:24, marginBottom:28,
        background:"linear-gradient(135deg,#0F1E35 0%,#1a1040 100%)",
        borderRadius:20, padding:"28px 32px", border:"1px solid #1E2A45" }}>
        <ScoreRing pct={latestPct} size={130} label="Latest" color="#4F46E5"/>
        <div>
          <div style={{ color:"#94A3B8", fontSize:13, marginBottom:4 }}>Latest Test Score</div>
          <div style={{ fontSize:36, fontWeight:800, color:"#F1F5F9",
            fontFamily:"'IBM Plex Mono',monospace" }}>
            {latestTotal}<span style={{ fontSize:18, color:"#94A3B8" }}>/{latest?.maxMarks ?? 300}</span>
          </div>
          <div style={{ color:"#94A3B8", fontSize:13, marginTop:6 }}>
            {latest?.exam ?? "No tests yet"} &nbsp;·&nbsp; {latest?.date ?? "—"}
          </div>
          <div style={{ display:"flex", gap:10, marginTop:12 }}>
            <Badge label={`🎓 ${studentInfo.target || "Set your target"}`} color="#4F46E5"/>
            <Badge label={`📊 ${tests.length} tests taken`} color="#818CF8"/>
          </div>
        </div>
        {trend.length > 1 && (
          <div style={{ marginLeft:"auto", textAlign:"right" }}>
            <div style={{ color:"#94A3B8", fontSize:11, marginBottom:6 }}>LAST {trend.length} MOCKS</div>
            <svg width={120} height={50}>
              {trend.map((v, i) => {
                const x = (i / (trend.length - 1)) * 110 + 5;
                const y = 45 - (v / 100) * 40;
                return (
                  <g key={i}>
                    {i > 0 && (
                      <line x1={(i-1)/(trend.length-1)*110+5}
                        y1={45-(trend[i-1]/100)*40} x2={x} y2={y}
                        stroke="#4F46E5" strokeWidth={2}/>
                    )}
                    <circle cx={x} cy={y} r={3} fill="#4F46E5"/>
                  </g>
                );
              })}
            </svg>
            <div style={{ color:"#F1F5F9", fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>
              {trend.join(" → ")}%
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Tests Taken", value:tests.length, icon:"📋", color:"#4F46E5" },
          { label:"Syllabus Done", value:`${syllabusPct}%`, icon:"✅", color:"#34D399" },
          { label:"Avg Score", value:avgScore, icon:"📈", color:"#F59E0B" },
          { label:"Chapters Done", value:`${syllabusCompleted}/${syllabusTotal}`, icon:"📖", color:"#818CF8" },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize:24 }}>{s.icon}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color,
              fontFamily:"'IBM Plex Mono',monospace", marginTop:4 }}>{s.value}</div>
            <div style={{ color:"#64748B", fontSize:12, marginTop:2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <div style={{ fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Subject Avg (All Mocks)</div>
          {SUBJECTS.map(s => {
            const avg = tests.length
              ? Math.round(tests.reduce((a,t)=>a+t[s.toLowerCase()],0)/tests.length)
              : 0;
            const maxPerSub = tests.length ? Math.round((tests[0]?.maxMarks??300)/3) : 100;
            const pct = Math.round((avg/maxPerSub)*100);
            return (
              <div key={s} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ color:SUB_COLOR[s], fontWeight:600, fontSize:13 }}>{s}</span>
                  <span style={{ color:"#F1F5F9", fontFamily:"'IBM Plex Mono',monospace", fontSize:13 }}>{avg} pts</span>
                </div>
                <MiniBar value={pct} color={SUB_COLOR[s]}/>
              </div>
            );
          })}
        </Card>
        <Card>
          <div style={{ fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Syllabus Progress</div>
          <div style={{ display:"flex", justifyContent:"center", margin:"8px 0" }}>
            <ScoreRing pct={syllabusPct} size={100} color="#34D399" label="done"/>
          </div>
          {SUBJECTS.map(s => {
            const total = CHAPTERS[s].length;
            const done = (syllabus[s]??[]).filter(Boolean).length;
            return (
              <div key={s} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:SUB_COLOR[s], fontSize:12 }}>{s}</span>
                  <span style={{ color:"#94A3B8", fontSize:12 }}>{done}/{total}</span>
                </div>
                <MiniBar value={done} max={total} color={SUB_COLOR[s]} height={5}/>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TEST ANALYSIS
// ═══════════════════════════════════════════════════════════
function TestAnalysis({ tests, setTests }) {
  const [selected, setSelected] = useState(tests[tests.length-1]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name:"", exam:"JEE Main", physics:"", chemistry:"", mathematics:"", maxMarks:"300", date: new Date().toLocaleDateString("en-IN") });

  const addTest = () => {
    if (!form.name || !form.physics) return;
    const t = {
      id: Date.now(), name:form.name, exam:form.exam, date:form.date,
      physics:+form.physics, chemistry:+form.chemistry, mathematics:+form.mathematics,
      maxMarks:+form.maxMarks, time:180
    };
    setTests(prev => [...prev, t]);
    setSelected(t.id);
    setAdding(false);
    setForm({ name:"", exam:"JEE Main", physics:"", chemistry:"", mathematics:"", maxMarks:"300", date:new Date().toLocaleDateString("en-IN") });
  };

  const test = tests.find(t=>t.id===selected);
  const totalPct = test ? Math.round(((test.physics+test.chemistry+test.mathematics)/test.maxMarks)*100) : 0;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ color:"#F1F5F9", margin:0 }}>Test Analysis</h2>
        <button onClick={()=>setAdding(!adding)} style={{ background:"#4F46E5",color:"#fff",
          border:"none",borderRadius:10,padding:"8px 18px",cursor:"pointer",fontWeight:600,fontSize:13 }}>
          + Add Test
        </button>
      </div>

      {adding && (
        <Card style={{ marginBottom:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[{key:"name",label:"Test Name",ph:"Full Mock #9"},{key:"date",label:"Date",ph:"dd/mm/yyyy"},
              {key:"maxMarks",label:"Max Marks",ph:"300"},{key:"physics",label:"Physics Score",ph:"0-100"},
              {key:"chemistry",label:"Chemistry Score",ph:"0-100"},{key:"mathematics",label:"Maths Score",ph:"0-100"},
            ].map(f=>(
              <div key={f.key}>
                <label style={{ color:"#94A3B8", fontSize:12 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  placeholder={f.ph}
                  style={{ display:"block",width:"100%",background:"#0A1628",border:"1px solid #1E2A45",
                    borderRadius:8,padding:"8px 12px",color:"#F1F5F9",marginTop:4,fontSize:14,boxSizing:"border-box" }}/>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12 }}>
            <label style={{ color:"#94A3B8",fontSize:12 }}>Exam</label>
            <select value={form.exam} onChange={e=>setForm(p=>({...p,exam:e.target.value}))}
              style={{ display:"block",background:"#0A1628",border:"1px solid #1E2A45",borderRadius:8,
                padding:"8px 12px",color:"#F1F5F9",marginTop:4,fontSize:14 }}>
              {EXAMS.map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <button onClick={addTest} style={{ marginTop:14,background:"#4F46E5",color:"#fff",
            border:"none",borderRadius:10,padding:"8px 24px",cursor:"pointer",fontWeight:600 }}>Save</button>
        </Card>
      )}

      {tests.length === 0 && (
        <Card><div style={{ color:"#64748B",textAlign:"center",padding:32 }}>
          No tests yet. Click "+ Add Test" to add your first mock test score.
        </div></Card>
      )}

      {tests.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:16 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {tests.map(t=>{
              const total=t.physics+t.chemistry+t.mathematics;
              const pct=Math.round((total/t.maxMarks)*100);
              return (
                <div key={t.id} onClick={()=>setSelected(t.id)}
                  style={{ cursor:"pointer",background:selected===t.id?"#1a1040":"#0F1E35",
                    border:`1px solid ${selected===t.id?"#4F46E5":"#1E2A45"}`,
                    borderRadius:12,padding:"12px 16px",transition:"all .2s" }}>
                  <div style={{ fontWeight:600,color:"#F1F5F9",fontSize:13 }}>{t.name}</div>
                  <div style={{ color:"#64748B",fontSize:11,marginTop:2 }}>{t.date} · {t.exam}</div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:8 }}>
                    <MiniBar value={pct} color="#4F46E5" height={4}/>
                    <span style={{ color:"#818CF8",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",minWidth:36 }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {test && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Card>
                <div style={{ display:"flex", alignItems:"center", gap:24 }}>
                  <ScoreRing pct={totalPct} size={110} color="#4F46E5"/>
                  <div>
                    <div style={{ fontWeight:700,color:"#F1F5F9",fontSize:18 }}>{test.name}</div>
                    <div style={{ color:"#94A3B8",fontSize:13,marginTop:4 }}>{test.exam} · {test.date}</div>
                    <div style={{ fontSize:28,fontWeight:800,color:"#818CF8",
                      fontFamily:"'IBM Plex Mono',monospace",marginTop:8 }}>
                      {test.physics+test.chemistry+test.mathematics}
                      <span style={{ fontSize:15,color:"#94A3B8" }}>/{test.maxMarks}</span>
                    </div>
                  </div>
                </div>
              </Card>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {SUBJECTS.map(s=>{
                  const score=test[s.toLowerCase()];
                  const max=Math.round(test.maxMarks/3);
                  const pct=Math.round((score/max)*100);
                  return (
                    <Card key={s}>
                      <div style={{ color:SUB_COLOR[s],fontWeight:700,marginBottom:8 }}>{s}</div>
                      <ScoreRing pct={pct} size={80} color={SUB_COLOR[s]} stroke={7}/>
                      <div style={{ color:"#F1F5F9",fontFamily:"'IBM Plex Mono',monospace",
                        fontSize:18,fontWeight:700,marginTop:8 }}>{score}/{max}</div>
                    </Card>
                  );
                })}
              </div>
              {tests.length > 1 && (
                <Card>
                  <div style={{ fontWeight:700,color:"#F1F5F9",marginBottom:16 }}>Score Trend</div>
                  <div style={{ overflowX:"auto" }}>
                    <svg width={Math.max(400,tests.length*60)} height={120}>
                      {SUBJECTS.map(s=>
                        tests.map((t,i)=>{
                          const score=t[s.toLowerCase()];
                          const max=Math.round(t.maxMarks/3);
                          const x=i*60+30;
                          const y=100-(score/max)*90;
                          const prev=tests[i-1];
                          return (
                            <g key={`${s}${i}`}>
                              {i>0&&(
                                <line x1={(i-1)*60+30}
                                  y1={100-(prev[s.toLowerCase()]/Math.round(prev.maxMarks/3))*90}
                                  x2={x} y2={y} stroke={SUB_COLOR[s]} strokeWidth={1.5} opacity={0.7}/>
                              )}
                              <circle cx={x} cy={y} r={4} fill={SUB_COLOR[s]}/>
                            </g>
                          );
                        })
                      )}
                      {tests.map((_,i)=>(
                        <text key={i} x={i*60+30} y={115} textAnchor="middle"
                          fill="#64748B" fontSize={10}>{`M${i+1}`}</text>
                      ))}
                    </svg>
                  </div>
                  <div style={{ display:"flex",gap:16,marginTop:8 }}>
                    {SUBJECTS.map(s=>(
                      <span key={s} style={{ display:"flex",alignItems:"center",gap:6,color:"#94A3B8",fontSize:12 }}>
                        <span style={{ width:12,height:3,background:SUB_COLOR[s],display:"inline-block",borderRadius:2 }}/>
                        {s}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SYLLABUS TRACKER
// ═══════════════════════════════════════════════════════════
function SyllabusTracker({ syllabus, setSyllabus, resources, setResources }) {
  const [activeSub, setActiveSub] = useState("Physics");
  const chapters = CHAPTERS[activeSub];
  const done = (syllabus[activeSub]??[]).filter(Boolean).length;

  const toggle = i => {
    setSyllabus(prev=>{
      const arr=[...(prev[activeSub]??[])];
      arr[i]=!arr[i];
      return {...prev,[activeSub]:arr};
    });
  };

  const toggleResource = (i, res) => {
    setResources(prev=>{
      const subRes={...(prev[activeSub]??{})};
      const chapRes=new Set(subRes[i]??[]);
      chapRes.has(res)?chapRes.delete(res):chapRes.add(res);
      subRes[i]=[...chapRes];
      return {...prev,[activeSub]:subRes};
    });
  };

  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        {SUBJECTS.map(s=>(
          <button key={s} onClick={()=>setActiveSub(s)}
            style={{ padding:"8px 20px",borderRadius:10,border:"none",cursor:"pointer",
              fontWeight:600,fontSize:13,
              background:activeSub===s?SUB_COLOR[s]:"#0F1E35",
              color:activeSub===s?"#0A1628":"#94A3B8",
              border:`1px solid ${activeSub===s?SUB_COLOR[s]:"#1E2A45"}` }}>
            {s}
          </button>
        ))}
      </div>

      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontWeight:700,color:"#F1F5F9",minWidth:220 }}>{activeSub} — {done}/{chapters.length} chapters</div>
          <MiniBar value={done} max={chapters.length} color={SUB_COLOR[activeSub]} height={8}/>
          <span style={{ color:SUB_COLOR[activeSub],fontFamily:"'IBM Plex Mono',monospace",
            fontSize:14,minWidth:44,textAlign:"right" }}>
            {Math.round((done/chapters.length)*100)}%
          </span>
        </div>
      </Card>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {chapters.map((ch,i)=>{
          const completed=!!(syllabus[activeSub]?.[i]);
          const chRes=new Set(resources[activeSub]?.[i]??[]);
          return (
            <Card key={ch} style={{ padding:"14px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div onClick={()=>toggle(i)} style={{
                  width:22,height:22,borderRadius:6,cursor:"pointer",flexShrink:0,
                  background:completed?SUB_COLOR[activeSub]:"transparent",
                  border:`2px solid ${completed?SUB_COLOR[activeSub]:"#1E2A45"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#0A1628"
                }}>{completed&&"✓"}</div>
                <span style={{ fontWeight:600,color:completed?"#94A3B8":"#F1F5F9",fontSize:14,
                  textDecoration:completed?"line-through":"none",flex:1 }}>{i+1}. {ch}</span>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {RESOURCE_TYPES.map(r=>(
                    <button key={r} onClick={()=>toggleResource(i,r)}
                      style={{ padding:"3px 10px",borderRadius:99,border:"none",cursor:"pointer",
                        fontSize:11,fontWeight:600,
                        background:chRes.has(r)?SUB_COLOR[activeSub]+"33":"#1E2A45",
                        color:chRes.has(r)?SUB_COLOR[activeSub]:"#64748B",
                        border:`1px solid ${chRes.has(r)?SUB_COLOR[activeSub]:"#1E2A45"}` }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RESOURCES
// ═══════════════════════════════════════════════════════════
function Resources({ resources }) {
  const [filter, setFilter] = useState("All");
  const items = [];
  for (const sub of SUBJECTS) {
    for (const [chapIdx, resArr] of Object.entries(resources[sub]??{})) {
      for (const r of resArr) {
        if (filter==="All"||r===filter)
          items.push({ sub, chapter:CHAPTERS[sub][+chapIdx], resource:r });
      }
    }
  }
  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {["All",...RESOURCE_TYPES].map(t=>(
          <button key={t} onClick={()=>setFilter(t)}
            style={{ padding:"6px 16px",borderRadius:99,border:"none",cursor:"pointer",
              fontWeight:600,fontSize:12,
              background:filter===t?"#4F46E5":"#0F1E35",
              color:filter===t?"#fff":"#94A3B8",
              border:`1px solid ${filter===t?"#4F46E5":"#1E2A45"}` }}>
            {t}
          </button>
        ))}
      </div>
      {items.length===0?(
        <Card><div style={{ color:"#94A3B8",textAlign:"center",padding:32 }}>
          No resources marked yet. Go to Syllabus Tracker and mark chapters.
        </div></Card>
      ):(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {items.map((item,i)=>(
            <Card key={i} style={{ padding:"12px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ background:SUB_COLOR[item.sub]+"22",color:SUB_COLOR[item.sub],
                  border:`1px solid ${SUB_COLOR[item.sub]}44`,borderRadius:99,
                  padding:"2px 10px",fontSize:11,fontWeight:600 }}>{item.sub}</span>
                <span style={{ color:"#F1F5F9",fontWeight:600 }}>{item.chapter}</span>
                <Badge label={item.resource} color="#4F46E5"/>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MOCK SCHEDULER
// ═══════════════════════════════════════════════════════════
function MockScheduler({ scheduled, setScheduled }) {
  const [form, setForm] = useState({ exam:"JEE Main", date:"", time:"09:00", notes:"" });

  const add = () => {
    if (!form.date) return;
    setScheduled(prev=>[...prev,{...form,id:Date.now()}]);
    setForm({ exam:"JEE Main",date:"",time:"09:00",notes:"" });
  };

  return (
    <div>
      <h2 style={{ color:"#F1F5F9", margin:"0 0 20px" }}>Mock Test Scheduler</h2>
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12 }}>
          <div>
            <label style={{ color:"#94A3B8",fontSize:12 }}>Date</label>
            <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}
              style={{ display:"block",width:"100%",background:"#0A1628",border:"1px solid #1E2A45",
                borderRadius:8,padding:"8px 12px",color:"#F1F5F9",marginTop:4,fontSize:14,boxSizing:"border-box" }}/>
          </div>
          <div>
            <label style={{ color:"#94A3B8",fontSize:12 }}>Time</label>
            <input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}
              style={{ display:"block",width:"100%",background:"#0A1628",border:"1px solid #1E2A45",
                borderRadius:8,padding:"8px 12px",color:"#F1F5F9",marginTop:4,fontSize:14,boxSizing:"border-box" }}/>
          </div>
          <div>
            <label style={{ color:"#94A3B8",fontSize:12 }}>Exam</label>
            <select value={form.exam} onChange={e=>setForm(p=>({...p,exam:e.target.value}))}
              style={{ display:"block",background:"#0A1628",border:"1px solid #1E2A45",
                borderRadius:8,padding:"8px 12px",color:"#F1F5F9",marginTop:4,fontSize:14,width:"100%" }}>
              {EXAMS.map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color:"#94A3B8",fontSize:12 }}>Notes</label>
            <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
              placeholder="optional"
              style={{ display:"block",width:"100%",background:"#0A1628",border:"1px solid #1E2A45",
                borderRadius:8,padding:"8px 12px",color:"#F1F5F9",marginTop:4,fontSize:14,boxSizing:"border-box" }}/>
          </div>
        </div>
        <button onClick={add} style={{ marginTop:14,background:"#4F46E5",color:"#fff",
          border:"none",borderRadius:10,padding:"8px 24px",cursor:"pointer",fontWeight:600 }}>
          Schedule
        </button>
      </Card>

      {scheduled.length===0?(
        <Card><div style={{ color:"#64748B",textAlign:"center",padding:24 }}>No mocks scheduled yet.</div></Card>
      ):(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {[...scheduled].sort((a,b)=>a.date.localeCompare(b.date)).map(s=>(
            <Card key={s.id} style={{ padding:"14px 18px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:16 }}>
                <div style={{ fontSize:28 }}>📅</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,color:"#F1F5F9" }}>{s.exam}</div>
                  <div style={{ color:"#94A3B8",fontSize:13 }}>{s.date} at {s.time}{s.notes&&` · ${s.notes}`}</div>
                </div>
                <button onClick={()=>setScheduled(prev=>prev.filter(x=>x.id!==s.id))}
                  style={{ background:"#1E2A45",border:"1px solid #2D3F5C",borderRadius:8,
                    color:"#94A3B8",padding:"6px 14px",cursor:"pointer",fontSize:13 }}>Remove</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RANK PREDICTOR
// ═══════════════════════════════════════════════════════════
function RankPredictor({ tests }) {
  const [score, setScore] = useState(200);
  const [exam, setExam] = useState("JEE Main");

  const predictRank = (s, ex) => {
    if (ex==="JEE Main") {
      if (s>=280) return "Top 100";
      if (s>=250) return `~${Math.round(500-(s-250)*20)} – ${Math.round(1500-(s-250)*40)}`;
      if (s>=200) return `~${Math.round(5000-(s-200)*80)} – ${Math.round(15000-(s-200)*200)}`;
      if (s>=150) return `~30,000 – 80,000`;
      return "80,000+";
    }
    if (ex==="JEE Advanced") {
      if (s>=250) return "Top 50";
      if (s>=200) return `~${Math.round(300-(s-200)*4)} – ${Math.round(1000)}`;
      if (s>=150) return `~2,000 – 6,000`;
      return "Below cutoff";
    }
    if (ex==="BITSAT") {
      if (s>=400) return "Top 100";
      if (s>=350) return `~500 – 2,000`;
      if (s>=300) return `~2,000 – 8,000`;
      return "8,000+";
    }
    return "Varies by campus";
  };

  const avgScore = tests.length
    ? Math.round(tests.reduce((a,t)=>a+(t.physics+t.chemistry+t.mathematics),0)/tests.length) : 0;

  return (
    <div>
      <h2 style={{ color:"#F1F5F9", margin:"0 0 20px" }}>Rank Predictor</h2>
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
          <div>
            <label style={{ color:"#94A3B8",fontSize:12 }}>Exam</label>
            <select value={exam} onChange={e=>setExam(e.target.value)}
              style={{ display:"block",background:"#0A1628",border:"1px solid #1E2A45",
                borderRadius:8,padding:"10px 14px",color:"#F1F5F9",marginTop:4,fontSize:14,width:"100%" }}>
              {EXAMS.map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color:"#94A3B8",fontSize:12 }}>
              Expected Score: <strong style={{ color:"#818CF8" }}>{score}</strong>
            </label>
            <input type="range" min={0} max={exam==="BITSAT"?450:360} value={score}
              onChange={e=>setScore(+e.target.value)}
              style={{ display:"block",width:"100%",marginTop:12,accentColor:"#4F46E5" }}/>
          </div>
        </div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:20 }}>
        <Card style={{ textAlign:"center" }}>
          <div style={{ fontSize:36 }}>🎯</div>
          <div style={{ color:"#94A3B8",fontSize:12,marginTop:4 }}>Predicted Rank</div>
          <div style={{ color:"#818CF8",fontFamily:"'IBM Plex Mono',monospace",
            fontWeight:800,fontSize:20,marginTop:8 }}>{predictRank(score,exam)}</div>
        </Card>
        <Card style={{ textAlign:"center" }}>
          <div style={{ fontSize:36 }}>📊</div>
          <div style={{ color:"#94A3B8",fontSize:12,marginTop:4 }}>Your Mock Avg</div>
          <div style={{ color:"#34D399",fontFamily:"'IBM Plex Mono',monospace",
            fontWeight:800,fontSize:24,marginTop:8 }}>{avgScore}</div>
        </Card>
        <Card style={{ textAlign:"center" }}>
          <div style={{ fontSize:36 }}>📈</div>
          <div style={{ color:"#94A3B8",fontSize:12,marginTop:4 }}>Gap to Close</div>
          <div style={{ color:score>avgScore?"#F87171":"#34D399",
            fontFamily:"'IBM Plex Mono',monospace",fontWeight:800,fontSize:24,marginTop:8 }}>
            {score>avgScore?`+${score-avgScore}`:`On track ✓`}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STUDY PLAN
// ═══════════════════════════════════════════════════════════
function StudyPlan({ plan, setPlan }) {
  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const update = (day, sub, val) => {
    setPlan(prev=>({...prev,[day]:{...(prev[day]??{}),[sub]:val}}));
  };

  return (
    <div>
      <h2 style={{ color:"#F1F5F9", margin:"0 0 20px" }}>Weekly Study Plan</h2>
      <Card style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th style={{ color:"#64748B",fontSize:12,fontWeight:600,padding:"8px 12px",textAlign:"left" }}>Day</th>
              {SUBJECTS.map(s=>(
                <th key={s} style={{ color:SUB_COLOR[s],fontSize:12,fontWeight:600,padding:"8px 12px",textAlign:"left" }}>{s}</th>
              ))}
              <th style={{ color:"#64748B",fontSize:12,fontWeight:600,padding:"8px 12px",textAlign:"left" }}>Total hrs</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day=>{
              const dayPlan=plan[day]??{};
              const total=SUBJECTS.reduce((a,s)=>a+(+dayPlan[s]||0),0);
              return (
                <tr key={day} style={{ borderTop:"1px solid #1E2A45" }}>
                  <td style={{ padding:"10px 12px",color:"#F1F5F9",fontWeight:600 }}>{day}</td>
                  {SUBJECTS.map(s=>(
                    <td key={s} style={{ padding:"10px 12px" }}>
                      <input type="number" min={0} max={12} step={0.5}
                        value={dayPlan[s]??""} onChange={e=>update(day,s,e.target.value)}
                        placeholder="0"
                        style={{ width:60,background:"#0A1628",border:"1px solid #1E2A45",
                          borderRadius:6,padding:"5px 8px",color:SUB_COLOR[s],
                          fontFamily:"'IBM Plex Mono',monospace",fontSize:14 }}/>
                    </td>
                  ))}
                  <td style={{ padding:"10px 12px",
                    color:total>=6?"#34D399":total>=4?"#F59E0B":"#94A3B8",
                    fontFamily:"'IBM Plex Mono',monospace",fontWeight:700 }}>{total}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STUDENT PAGE
// ═══════════════════════════════════════════════════════════
function StudentPage({ tests, syllabus, studentInfo, setStudentInfo, userEmail }) {
  const syllabusTotal = Object.values(syllabus).flat().length;
  const syllabusCompleted = Object.values(syllabus).flat().filter(Boolean).length;
  const syllabusPct = syllabusTotal ? Math.round((syllabusCompleted/syllabusTotal)*100) : 0;
  const avgScore = tests.length
    ? Math.round(tests.reduce((a,t)=>a+(t.physics+t.chemistry+t.mathematics),0)/tests.length) : 0;

  return (
    <div>
      <h2 style={{ color:"#F1F5F9", margin:"0 0 20px" }}>Student Profile</h2>
      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20 }}>
        <Card style={{ textAlign:"center", padding:"32px 24px" }}>
          <div style={{ width:80,height:80,borderRadius:"50%",
            background:"linear-gradient(135deg,#4F46E5,#818CF8)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:28,fontWeight:800,color:"#fff",margin:"0 auto 16px" }}>
            {(studentInfo.name||userEmail||"?").slice(0,2).toUpperCase()}
          </div>
          <div style={{ fontWeight:800,color:"#F1F5F9",fontSize:20 }}>{studentInfo.name||"Your Name"}</div>
          <div style={{ color:"#94A3B8",fontSize:13,marginTop:4 }}>{userEmail}</div>
          <div style={{ marginTop:8 }}><Badge label={studentInfo.target||"Set your target"} color="#4F46E5"/></div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:24 }}>
            {[
              {label:"Tests",value:tests.length,color:"#818CF8"},
              {label:"Avg Score",value:avgScore,color:"#F59E0B"},
              {label:"Syllabus",value:`${syllabusPct}%`,color:"#34D399"},
              {label:"Chapters",value:syllabusCompleted,color:"#F87171"},
            ].map(s=>(
              <div key={s.label} style={{ background:"#0A1628",borderRadius:10,
                padding:"10px 8px",border:"1px solid #1E2A45" }}>
                <div style={{ color:s.color,fontFamily:"'IBM Plex Mono',monospace",
                  fontWeight:800,fontSize:18 }}>{s.value}</div>
                <div style={{ color:"#64748B",fontSize:11 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight:700,color:"#F1F5F9",marginBottom:16 }}>Edit Details</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            {[
              {k:"name",l:"Full Name"},{k:"class",l:"Class"},
              {k:"target",l:"Target College & Branch"},{k:"school",l:"School"},
              {k:"city",l:"City"},{k:"phone",l:"Phone"},
              {k:"dob",l:"Date of Birth"},{k:"coachingInstitute",l:"Coaching Institute"},
            ].map(f=>(
              <div key={f.k}>
                <label style={{ color:"#94A3B8",fontSize:12 }}>{f.l}</label>
                <input value={studentInfo[f.k]||""} onChange={e=>setStudentInfo(p=>({...p,[f.k]:e.target.value}))}
                  style={{ display:"block",width:"100%",background:"#0A1628",
                    border:"1px solid #1E2A45",borderRadius:8,padding:"8px 12px",
                    color:"#F1F5F9",marginTop:4,fontSize:14,boxSizing:"border-box" }}/>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12,color:"#64748B",fontSize:12 }}>
            ✅ All changes are saved automatically to your account.
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════
export default function App({ user, db, signOut }) {
  const [tab, setTab] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // All user data lives here
  const [tests, setTests] = useState([]);
  const [syllabus, setSyllabus] = useState(EMPTY_SYLLABUS);
  const [resources, setResources] = useState(EMPTY_RESOURCES);
  const [scheduled, setScheduled] = useState([]);
  const [plan, setPlan] = useState(EMPTY_PLAN);
  const [studentInfo, setStudentInfo] = useState(EMPTY_STUDENT);

  // ── Load from Firestore on mount ──────────────────────────
  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          if (d.tests) setTests(d.tests);
          if (d.syllabus) setSyllabus(d.syllabus);
          if (d.resources) setResources(d.resources);
          if (d.scheduled) setScheduled(d.scheduled);
          if (d.plan) setPlan(d.plan);
          if (d.studentInfo) setStudentInfo(d.studentInfo);
        }
      } catch (e) { console.error("Load error", e); }
      setLoading(false);
    })();
  }, [user, db]);

  // ── Save to Firestore whenever data changes ───────────────
  const save = useCallback(async (data) => {
    if (!user || !db) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), data, { merge: true });
    } catch (e) { console.error("Save error", e); }
    setTimeout(() => setSaving(false), 800);
  }, [user, db]);

  useEffect(() => { if (!loading) save({ tests }); }, [tests]);
  useEffect(() => { if (!loading) save({ syllabus }); }, [syllabus]);
  useEffect(() => { if (!loading) save({ resources }); }, [resources]);
  useEffect(() => { if (!loading) save({ scheduled }); }, [scheduled]);
  useEffect(() => { if (!loading) save({ plan }); }, [plan]);
  useEffect(() => { if (!loading) save({ studentInfo }); }, [studentInfo]);

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"#060D1A",display:"flex",
      alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,
      fontFamily:"Inter,sans-serif" }}>
      <div style={{ width:48,height:48,borderRadius:12,
        background:"linear-gradient(135deg,#4F46E5,#818CF8)",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontWeight:900,fontSize:18,color:"#fff" }}>IIT</div>
      <div style={{ color:"#94A3B8",fontSize:16 }}>Loading your data…</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"#060D1A",color:"#F1F5F9",
      fontFamily:"Inter,'Segoe UI',system-ui,sans-serif",display:"flex" }}>

      {/* Sidebar */}
      <div style={{ width:sideOpen?220:64,transition:"width .3s ease",
        background:"#080F1F",borderRight:"1px solid #1E2A45",
        display:"flex",flexDirection:"column",flexShrink:0,zIndex:10,
        position:"sticky",top:0,height:"100vh",overflowY:"auto" }}>

        <div style={{ padding:"20px 16px 12px",borderBottom:"1px solid #1E2A45",
          display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:8,flexShrink:0,
            background:"linear-gradient(135deg,#4F46E5,#818CF8)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:900,fontSize:14,color:"#fff" }}>IIT</div>
          {sideOpen&&<div style={{ fontWeight:800,fontSize:15,color:"#F1F5F9",letterSpacing:.3 }}>PrepPortal</div>}
          <button onClick={()=>setSideOpen(!sideOpen)} style={{ marginLeft:"auto",background:"none",
            border:"none",color:"#64748B",cursor:"pointer",fontSize:16,padding:0 }}>
            {sideOpen?"◀":"▶"}
          </button>
        </div>

        <nav style={{ padding:"12px 8px",flex:1 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} title={t.label}
              style={{ display:"flex",alignItems:"center",gap:10,width:"100%",
                padding:"10px 10px",borderRadius:10,border:"none",cursor:"pointer",marginBottom:4,
                background:tab===t.id?"#4F46E511":"transparent",
                color:tab===t.id?"#818CF8":"#64748B",
                borderLeft:tab===t.id?"3px solid #4F46E5":"3px solid transparent",
                fontWeight:tab===t.id?700:400,fontSize:14,textAlign:"left",transition:"all .15s" }}>
              <span style={{ fontSize:16,flexShrink:0 }}>{t.icon}</span>
              {sideOpen&&<span style={{ whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{t.label}</span>}
            </button>
          ))}
        </nav>

        {/* Sign out at bottom of sidebar */}
        <div style={{ padding:"12px 8px",borderTop:"1px solid #1E2A45" }}>
          {sideOpen && (
            <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:8 }}>
              <div style={{ width:28,height:28,borderRadius:"50%",
                background:"linear-gradient(135deg,#4F46E5,#818CF8)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontWeight:700,fontSize:11,color:"#fff",flexShrink:0 }}>
                {(studentInfo.name||user.email||"?").slice(0,2).toUpperCase()}
              </div>
              <div style={{ overflow:"hidden" }}>
                <div style={{ color:"#F1F5F9",fontWeight:600,fontSize:12,
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                  {studentInfo.name||"Student"}
                </div>
                <div style={{ color:"#64748B",fontSize:10,whiteSpace:"nowrap",
                  overflow:"hidden",textOverflow:"ellipsis" }}>{user.email}</div>
              </div>
            </div>
          )}
          <button onClick={signOut}
            style={{ display:"flex",alignItems:"center",gap:8,width:"100%",
              padding:"9px 10px",borderRadius:10,border:"1px solid #2D3F5C",
              cursor:"pointer",background:"#0A1628",color:"#F87171",
              fontWeight:600,fontSize:13,textAlign:"left" }}>
            <span style={{ fontSize:16 }}>🚪</span>
            {sideOpen&&"Sign Out"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1,overflow:"auto" }}>
        {/* Topbar */}
        <div style={{ padding:"16px 32px",borderBottom:"1px solid #1E2A45",
          background:"#080F1F",position:"sticky",top:0,zIndex:5,
          display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ fontWeight:700,color:"#F1F5F9",fontSize:18 }}>
            {TABS.find(t=>t.id===tab)?.label}
          </div>
          <div style={{ display:"flex",gap:12,alignItems:"center" }}>
            {saving&&(
              <span style={{ color:"#34D399",fontSize:12,fontFamily:"'IBM Plex Mono',monospace" }}>
                ✓ Saved
              </span>
            )}
            <Badge label={`${tests.length} tests`} color="#4F46E5"/>
            <Badge label={`${studentInfo.target||"Set target →"}`} color="#F59E0B"/>
          </div>
        </div>

        <div style={{ padding:"24px 32px",maxWidth:1100 }}>
          {tab==="dashboard" && <Dashboard tests={tests} syllabus={syllabus} studentInfo={studentInfo}/>}
          {tab==="tests"     && <TestAnalysis tests={tests} setTests={setTests}/>}
          {tab==="syllabus"  && <SyllabusTracker syllabus={syllabus} setSyllabus={setSyllabus} resources={resources} setResources={setResources}/>}
          {tab==="resources" && <Resources resources={resources}/>}
          {tab==="scheduler" && <MockScheduler scheduled={scheduled} setScheduled={setScheduled}/>}
          {tab==="rank"      && <RankPredictor tests={tests}/>}
          {tab==="studyplan" && <StudyPlan plan={plan} setPlan={setPlan}/>}
          {tab==="student"   && <StudentPage tests={tests} syllabus={syllabus} studentInfo={studentInfo} setStudentInfo={setStudentInfo} userEmail={user.email}/>}
        </div>
      </div>
    </div>
  );
}

