import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, ArrowLeft, Check, FileText, Home, Search, ShieldCheck,
  UploadCloud, Sparkles, Clock3, AlertTriangle, Wrench, DoorOpen,
  CircleDollarSign, Lightbulb, Lock, X, LoaderCircle, MessageCircle, Send, Gauge
} from "lucide-react";
import { askAgreement, uploadAgreement, explainClause, getChecklist, compareAgreement } from "./services/api";
import "./styles.css";

const categories = [
  ["Rent", CircleDollarSign],
  ["Deposit", ShieldCheck],
  ["Maintenance", Wrench],
  ["Termination", DoorOpen],
  ["Penalty", AlertTriangle],
  ["Utilities", Lightbulb],
];

const roadmapFeatures = [
  [Sparkles, "AI Clause Explanations", "Understand difficult legal language in simple words."],
  [Check, "Smart Tenant Checklist", "Know what you should verify before signing."],
  [Search, "Agreement Comparison", "Compare two rental agreements side by side."],
];

function App() {
  const [page, setPage] = useState("home");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const goAnalyzer = () => { setError(""); setPage("analyzer"); };

  return (
    <div className="app">
      {page === "home" && <HomePage onStart={goAnalyzer} />}
      {page === "analyzer" && (
        <AnalyzerPage
          onBack={() => setPage("home")}
          onResult={(data) => { setResult(data); setPage("results"); }}
          error={error}
          setError={setError}
        />
      )}
      {page === "results" && (
        <ResultsPage
          result={result}
          onBack={() => setPage("analyzer")}
          onHome={() => setPage("home")}
        />
      )}
    </div>
  );
}

function Header({ onStart, onHome }) {
  return (
    <header className="nav">
      <button className="brand" onClick={onHome || (() => window.scrollTo({top:0, behavior:"smooth"}))}>
        <span className="brand-mark"><FileText size={18}/><Check size={12}/></span>
        <span>Rent<span>Wise</span></span>
      </button>
      <nav>
        <a href="#how">How It Works</a>
        <a href="#features">Features</a>
        <button className="nav-cta" onClick={onStart}>Analyze Agreement <ArrowRight size={16}/></button>
      </nav>
    </header>
  );
}

function HomePage({ onStart }) {
  return (
    <>
      <Header onStart={onStart} />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15}/> AI-Powered Rental Agreement Analysis</div>
            <h1>Understand your <em>rental agreement</em> before you sign.</h1>
            <p>RentWise helps you find rent, deposit, notice periods, responsibilities and important clauses without reading through every line.</p>
            <div className="hero-actions">
              <button className="primary-btn" onClick={onStart}>Analyze My Agreement <ArrowRight size={18}/></button>
              <a className="text-btn" href="#how">See How It Works <ArrowRight size={17}/></a>
            </div>
            <div className="trust-line"><ShieldCheck size={16}/> Simple, transparent, document-first analysis</div>
          </div>

          <div className="hero-visual">
            <div className="glow"></div>
            <div className="doc-preview">
              <div className="doc-top"><span className="file-icon"><FileText size={20}/></span><div><b>Rental Agreement.pdf</b><small>2.4 MB • Ready to analyze</small></div><Check className="ok" size={19}/></div>
              <div className="doc-lines"><i></i><i></i><i className="short"></i><i></i></div>
              <div className="detected">
                <ResultPill text="Rent detected" />
                <ResultPill text="Deposit detected" />
                <ResultPill text="Notice period" />
                <ResultPill text="Important clause" />
              </div>
            </div>
            <div className="floating-card card-one"><Search size={16}/><span><b>7</b> key details found</span></div>
            <div className="floating-card card-two"><ShieldCheck size={16}/><span>Review with confidence</span></div>
          </div>
        </section>

        <section className="value-row" id="features">
          <Value icon={FileText} title="Upload your agreement" text="PDF or DOCX, up to 10 MB." />
          <Value icon={Search} title="Find important details" text="Rent, deposit, notice and more." />
          <Value icon={Lightbulb} title="Understand clauses" text="Grouped into simple categories." />
          <Value icon={Check} title="Review before signing" text="See what matters at a glance." />
        </section>

        <section className="how" id="how">
          <div className="section-heading"><span>HOW IT WORKS</span><h2>From document to clarity in three steps.</h2></div>
          <div className="steps">
            <Step n="01" title="Upload" text="Upload your PDF or DOCX rental agreement." icon={UploadCloud}/>
            <Step n="02" title="Analyze" text="RentWise extracts and analyzes important information." icon={Search}/>
            <Step n="03" title="Understand" text="Get a simple overview of important terms and clauses." icon={Check}/>
          </div>
        </section>

        <section className="future">
          <div><span className="section-label">AVAILABLE AFTER ANALYSIS</span><h2>More clarity for every agreement.</h2></div>
          <RoadmapFeatures />
        </section>
      </main>
      <Footer />
    </>
  );
}

function AnalyzerPage({ onBack, onResult, error, setError }) {
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  async function analyze() {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const data = await uploadAgreement(file, location);
      onResult(data);
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  }

  function choose(e) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  return (
    <>
      <header className="nav product-nav">
        <button className="brand" onClick={onBack}><span className="brand-mark"><FileText size={18}/><Check size={12}/></span><span>Rent<span>Wise</span></span></button>
        <button className="back-btn" onClick={onBack}><ArrowLeft size={16}/> Back to Home</button>
      </header>
      <main className="analyzer">
        <div className="product-heading"><span className="section-label">DOCUMENT ANALYZER</span><h1>Analyze your rental agreement</h1><p>Upload your agreement and we'll highlight the details that matter.</p></div>

        {busy ? (
          <div className="processing">
            <div className="loader"><LoaderCircle size={38}/></div>
            <h2>Analyzing your agreement...</h2>
            <p>RentWise is reading the document and finding useful details.</p>
            <div className="process-list">
              <Process text="Reading document" done />
              <Process text="Extracting text" done />
              <Process text="Finding important details" active />
              <Process text="Categorizing clauses" />
            </div>
          </div>
        ) : (
          <div className="upload-layout">
            <div className={"upload-box " + (drag ? "dragging" : "")}
              onDragOver={(e)=>{e.preventDefault();setDrag(true)}}
              onDragLeave={()=>setDrag(false)}
              onDrop={(e)=>{e.preventDefault();setDrag(false); const f=e.dataTransfer.files?.[0]; if(f)setFile(f)}}
            >
              <div className="upload-icon"><UploadCloud size={30}/></div>
              <h2>Drop your agreement here</h2>
              <p>or</p>
              <label className="browse">Browse your files<input type="file" accept=".pdf,.docx" onChange={choose}/></label>
              <small>PDF or DOCX • Max 10 MB</small>
            </div>
            <div className="upload-help"><ShieldCheck size={18}/><div><b>Private by design</b><span>Your document is processed only for this analysis.</span></div></div>
            <label className="location-field"><span>Property city or location <small>Optional, used for market estimates</small></span><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Pune or Bengaluru" /></label>
          </div>
        )}

        {file && !busy && <div className="selected-file"><div className="selected-icon"><FileText size={21}/></div><div className="selected-info"><b>{file.name}</b><span>{formatBytes(file.size)}</span></div><button onClick={()=>setFile(null)} aria-label="Remove file"><X size={17}/></button><button className="primary-btn compact" onClick={analyze}>Analyze Agreement <ArrowRight size={17}/></button></div>}
        {error && <div className="error-box"><AlertTriangle size={18}/><div><b>We couldn't analyze that document.</b><span>{error}</span></div></div>}
        <p className="disclaimer">RentWise provides general information and simplified explanations. It does not provide professional legal advice.</p>
      </main>
    </>
  );
}

function ResultsPage({ result, onBack, onHome }) {
  const [active, setActive] = useState("Rent");
  const info = result?.information || {};
  const clause = (result?.clauses || []).find(c => c.category === active);
  return (
    <>
      <header className="nav product-nav">
        <button className="brand" onClick={onHome}><span className="brand-mark"><FileText size={18}/><Check size={12}/></span><span>Rent<span>Wise</span></span></button>
        <div className="result-actions"><button className="back-btn" onClick={onBack}><ArrowLeft size={16}/> Analyze another</button></div>
      </header>
      <main className="results">
        <div className="result-head">
          <div><span className="section-label">ANALYSIS COMPLETE</span><h1>Your Agreement at a Glance</h1><p>Here's what we found in your rental agreement.</p></div>
          <div className="result-file"><FileText size={18}/><span>{result?.filename || "Rental Agreement"}</span><Check size={17}/></div>
        </div>

        {result?.scanned && <div className="info-box"><AlertTriangle size={18}/><span>This document appears to be scanned. OCR support will be added in a future version.</span></div>}

        <div className="info-grid">
          <InfoCard icon={Home} label="MONTHLY RENT" value={formatMoney(info.monthly_rent)} sub="per month"/>
          <InfoCard icon={ShieldCheck} label="SECURITY DEPOSIT" value={formatMoney(info.security_deposit)} />
          <InfoCard icon={Clock3} label="NOTICE PERIOD" value={info.notice_period} />
          <InfoCard icon={Lock} label="LOCK-IN PERIOD" value={info.lock_in_period} />
          <InfoCard icon={FileText} label="AGREEMENT DURATION" value={info.agreement_duration} />
          <InfoCard icon={Wrench} label="MAINTENANCE" value={info.maintenance} />
          <InfoCard icon={AlertTriangle} label="PENALTY" value={info.penalty} />
        </div>

        <RentForecast forecast={info.rent_forecast} />

        <section className="attention"><div className="attention-title"><span><AlertTriangle size={19}/></span><div><h2>Things You Should Know</h2><p>Important points detected from the agreement.</p></div></div><div className="attention-grid">
          {buildAttention(info, result?.clauses).map((x,i)=><div className="attention-card" key={i}><Check size={17}/><span>{x}</span></div>)}
        </div></section>

        <section className="clauses"><div className="section-heading"><span>EXPLORE AGREEMENT CLAUSES</span><h2>Find details by category.</h2></div>
          <div className="category-tabs">{categories.map(([name,Icon])=><button className={active===name?"active":""} onClick={()=>setActive(name)} key={name}><Icon size={17}/>{name}</button>)}</div>
          <div className="clause-panel"><div className="clause-label"><span>{active.toUpperCase()}</span><b>{clause?.clauses?.length || 0} detected</b></div>
            {clause?.clauses?.length ? clause.clauses.map((item,i)=><ClauseItem item={item} category={active} key={i}/>) : <div className="empty-clause">No matching clause was found for this category.</div>}
          </div>
        </section>

        <RiskSection risks={result?.risks || []} fairness={result?.fairness} />
        <ChatPanel documentId={result?.document_id} />
        <ChecklistPanel documentId={result?.document_id} />
        <ComparePanel documentId={result?.document_id} />

        <section className="summary"><div className="summary-icon"><Sparkles size={20}/></div><div><span className="section-label">BASIC AGREEMENT SUMMARY</span><h2>What RentWise found</h2><p>{result?.summary}</p><small>This is a rule-based summary for the current project phase, not advanced AI-generated legal advice.</small></div></section>

        <section className="coming"><div className="section-heading"><span>AVAILABLE TOOLS</span><h2>More clarity for your agreement.</h2></div><RoadmapFeatures /></section>
      </main>
      <Footer />
    </>
  );
}

function InfoCard({icon:Icon,label,value,sub}) { return <div className="info-card"><div className="info-icon"><Icon size={18}/></div><span>{label}</span><strong>{value || "Not Found"}</strong>{sub && <small>{sub}</small>}</div> }
function RentForecast({ forecast }) {
  const contractual = forecast?.contractual;
  const market = forecast?.market_estimate;
  if (!contractual && !market) return null;
  return <section className="rent-forecast"><div className="forecast-heading"><div className="forecast-icon"><CircleDollarSign size={19}/></div><div><span className="section-label">RENT INCREASE PREDICTOR</span><h2>Plan for what rent could cost next.</h2></div></div><div className="forecast-grid">{contractual && <div className="forecast-card exact"><span>CONTRACTUAL INCREASE</span><strong>{contractual.percentage}% after {formatPeriod(contractual.after_months)}</strong><p>Estimated future rent: <b>{formatMoney(contractual.future_rent)}</b></p><small>Based on an escalation clause found in your agreement.</small></div>}{market && <div className="forecast-card"><span>LOCATION-BASED PLANNING ESTIMATE</span><strong>{market.location}: {market.annual_low_percent}%–{market.annual_high_percent}% / year</strong><p>After 12 months: <b>{formatRange(market.after_12_months)}</b></p><p>After 24 months: <b>{formatRange(market.after_24_months)}</b></p><small>{market.basis}</small></div>}</div></section>;
}
function RiskSection({ risks, fairness }) {
  return <section className="risk-section"><div className="score-card"><div className="score-heading"><div className="score-icon"><Gauge size={20}/></div><div><span className="section-label">FAIRNESS SCORE</span><h2>{fairness?.score ?? 0}<small>/100</small></h2><p>{fairness?.label || "Needs review"}</p></div></div><div className="score-bar"><span style={{width: `${fairness?.score ?? 0}%`}} /></div><div className="factor-list">{(fairness?.factors || []).map(factor => <div className="factor" key={factor.name}><span>{factor.name}</span><b className={factor.status === "Found" ? "found" : "missing"}>{factor.status}</b></div>)}</div></div><div className="risk-card"><div className="risk-heading"><AlertTriangle size={19}/><div><span className="section-label">RISK DETECTION</span><h2>{risks.length ? `${risks.length} clause${risks.length === 1 ? "" : "s"} to review` : "No elevated risks found"}</h2></div></div>{risks.length ? risks.slice(0,4).map((risk,i)=><div className="risk-item" key={i}><span className={`risk-dot ${risk.level.toLowerCase()}`}></span><div><b>{risk.level} risk</b><p>{risk.reason}</p><small>“{risk.clause}”</small></div></div>) : <p className="clear-risk">The rule-based review did not detect a high or medium risk signal.</p>}</div></section>;
}
function ChatPanel({ documentId }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function ask(e) { e.preventDefault(); if (!question.trim()) return; setBusy(true); setError(""); try { setAnswer(await askAgreement(documentId, question)); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <section className="chat-panel"><div className="chat-title"><div className="chat-icon"><MessageCircle size={20}/></div><div><span className="section-label">ASK YOUR AGREEMENT</span><h2>Have a question?</h2><p>Answers are limited to the uploaded document.</p></div></div><form onSubmit={ask} className="chat-form"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="e.g. Who is responsible for repairs?" aria-label="Ask a question about the agreement"/><button className="primary-btn compact" disabled={busy}>{busy ? "Thinking..." : "Ask"} <Send size={16}/></button></form>{error && <p className="chat-error">{error}</p>}{answer && <div className="chat-answer"><b>RentWise found:</b><p>{answer.answer}</p>{answer.sources?.length > 0 && <small>Source text is quoted from your uploaded agreement.</small>}</div>}</section>;
}
function ClauseItem({ item, category }) {
  const [explanation, setExplanation] = useState(null);
  const [busy, setBusy] = useState(false);
  async function explain() { setBusy(true); try { setExplanation(await explainClause(item.text, category)); } finally { setBusy(false); } }
  return <div className="clause"><div className="clause-meta"><span className={`risk-dot ${item.risk.toLowerCase()}`}></span><b>{item.risk} risk</b></div><p>“{item.text}”</p><small>{item.reason}</small><button className="explain-btn" onClick={explain} disabled={busy}><Sparkles size={13}/>{busy ? "Explaining..." : "Explain simply"}</button>{explanation && <div className="explanation"><b>In simple words</b><p>{explanation.plain_language}</p><small>Questions to ask: {explanation.questions_to_ask.join(" ")}</small></div>}</div>;
}
function ChecklistPanel({ documentId }) {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  async function load() { setBusy(true); try { setItems((await getChecklist(documentId)).items); } finally { setBusy(false); } }
  return <section className="tool-panel"><div className="tool-heading"><div className="tool-icon"><Check size={19}/></div><div><span className="section-label">SMART TENANT CHECKLIST</span><h2>Know what to verify before signing.</h2></div><button className="primary-btn compact" onClick={load} disabled={busy}>{busy ? "Building..." : items ? "Refresh" : "Build checklist"}</button></div>{items && <div className="checklist">{items.map(item => <div className="check-item" key={item.text}><span className={item.status === "Found" ? "found" : "check"}>{item.status === "Found" ? <Check size={13}/> : ""}</span><span>{item.text}</span><small>{item.status === "Found" ? "Mentioned" : "Verify"}</small></div>)}</div>}</section>;
}
function ComparePanel({ documentId }) {
  const [comparison, setComparison] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function compare(e) { const file = e.target.files?.[0]; if (!file) return; setBusy(true); setError(""); try { setComparison(await compareAgreement(documentId, file)); } catch (err) { setError(err.message); } finally { setBusy(false); e.target.value = ""; } }
  return <section className="tool-panel"><div className="tool-heading"><div className="tool-icon"><Search size={19}/></div><div><span className="section-label">AGREEMENT COMPARISON</span><h2>Compare another agreement side by side.</h2></div><label className="browse compact">{busy ? "Comparing..." : "Choose agreement"}<input type="file" accept=".pdf,.docx" onChange={compare} disabled={busy}/></label></div>{error && <p className="chat-error">{error}</p>}{comparison && <div className="comparison"><div className="compare-header"><b>Current agreement</b><b>{comparison.filename || "Second agreement"}</b></div>{comparison.fields.map(field => <div className="compare-row" key={field.label}><span>{field.label}</span><b>{field.first}</b><b className={field.match ? "same" : "different"}>{field.second}</b></div>)}<div className="score-compare"><span>Fairness score</span><b>{comparison.first_score}/100</b><b>{comparison.second_score}/100</b></div></div>}</section>;
}
function ResultPill({text}) { return <div className="result-pill"><Check size={13}/>{text}</div> }
function Value({icon:Icon,title,text}) { return <div className="value"><span><Icon size={19}/></span><div><b>{title}</b><small>{text}</small></div></div> }
function Step({n,title,text,icon:Icon}) { return <div className="step"><span className="step-num">{n}</span><div className="step-icon"><Icon size={22}/></div><h3>{title}</h3><p>{text}</p></div> }
function RoadmapFeatures() { return <div className="future-grid">{roadmapFeatures.map(([icon, title, text]) => <Future key={title} icon={icon} title={title} text={text} />)}</div> }
function Future({icon:Icon,title,text}) { return <div className="future-card"><div className="future-icon"><Icon size={19}/></div><div><h3>{title}<span>AVAILABLE NOW</span></h3><p>{text}</p></div><Check className="available-icon" size={16}/></div> }
function Process({text,done,active}) { return <div className={"process " + (done?"done ":"")+(active?"active":"")}><span>{done?<Check size={13}/>:active?<LoaderCircle size={13}/>:null}</span>{text}</div> }
function Footer(){return <footer><div className="footer-brand"><span className="brand-mark"><FileText size={17}/><Check size={11}/></span><b>RentWise</b></div><span>General information only — not professional legal advice.</span></footer>}

function buildAttention(info, clauses=[]) {
  const arr = [];
  if (info.notice_period !== "Not Found") arr.push(`${info.notice_period} notice is required before leaving.`);
  const maint = clauses.find(x=>x.category==="Maintenance");
  if (maint?.clauses?.length) arr.push("Maintenance responsibilities are mentioned in the agreement.");
  const dep = clauses.find(x=>x.category==="Deposit");
  if (dep?.clauses?.length) arr.push("Security deposit or refund conditions are mentioned.");
  if (!arr.length) arr.push("Review the detected values and clause categories before signing.");
  return arr.slice(0,3);
}
function formatBytes(n){ if(n<1024)return n+" B"; if(n<1024*1024)return (n/1024).toFixed(1)+" KB"; return (n/1024/1024).toFixed(1)+" MB"; }
function formatMoney(v){ if(v === undefined || v === null || v === "Not Found") return "Not Found"; const value = String(v); return value.startsWith("₹") ? value : "₹"+value; }
function formatRange(values){ return values?.map(value => formatMoney(value)).join("–") || "Not Found"; }
function formatPeriod(months){ return months % 12 === 0 ? `${months / 12} year${months === 12 ? "" : "s"}` : `${months} months`; }

createRoot(document.getElementById("root")).render(<App />);
