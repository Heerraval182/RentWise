import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, ArrowLeft, Check, FileText, Home, Search, ShieldCheck,
  UploadCloud, Sparkles, Clock3, AlertTriangle, Wrench, DoorOpen,
  CircleDollarSign, Lightbulb, Lock, X, LoaderCircle, MessageCircle, Send,
  Gauge, Building, Briefcase, Plus, Users, Key, Tag, LogOut, ChevronDown,
  AlertCircle, LogIn, User, Bookmark
} from "lucide-react";
import {
  askAgreement,
  uploadAgreement,
  explainClause,
  getChecklist,
  compareAgreement,
  getCurrentUser,
  logoutUser,
  saveAgreementToAccount,
} from "./services/api";
import CustomerDashboard from "./components/CustomerDashboard";
import BrokerDashboard from "./components/BrokerDashboard";
import AuthModal, { AuthPanel } from "./components/AuthModal";
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
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("rentwise_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("rentwise_token") || "");
  const [page, setPage] = useState(() => {
    try {
      const saved = localStorage.getItem("rentwise_user");
      const tok = localStorage.getItem("rentwise_token");
      if (saved && tok) {
        const parsed = JSON.parse(saved);
        return parsed?.role === "broker" ? "broker" : "customer";
      }
    } catch {}
    return "auth"; // Always show Login / Registration first when unauthenticated
  }); // "auth" | "analyzer" | "results" | "customer" | "broker"
  const [customerSection, setCustomerSection] = useState("overview"); // "overview" | "buy" | "rent" | "account"
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [initialLocation, setInitialLocation] = useState("");
  const [landingAuthConfig, setLandingAuthConfig] = useState({
    mode: "login",
    targetRole: "customer",
    contextMessage: "",
  });

  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: "login",
    targetRole: "customer",
    pendingNav: null,
    pendingCustomerSection: "overview",
    contextMessage: "",
  });

  // Verify stored session on startup
  useEffect(() => {
    if (token) {
      getCurrentUser(token).then((verifiedUser) => {
        if (verifiedUser) {
          setUser(verifiedUser);
          localStorage.setItem("rentwise_user", JSON.stringify(verifiedUser));
        } else {
          setUser(null);
          setToken("");
          localStorage.removeItem("rentwise_user");
          localStorage.removeItem("rentwise_token");
          setPage((prev) => (prev === "customer" || prev === "broker" ? "auth" : prev));
        }
      });
    }
  }, []);

  const openAuthModal = (
    mode = "login",
    targetRole = "customer",
    pendingNav = null,
    contextMessage = "",
    pendingCustomerSection = "overview"
  ) => {
    setAuthModal({
      isOpen: true,
      mode,
      targetRole: targetRole || "customer",
      pendingNav,
      pendingCustomerSection,
      contextMessage,
    });
  };

  const handleAuthSuccess = async (loggedInUser, authToken) => {
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem("rentwise_user", JSON.stringify(loggedInUser));
    localStorage.setItem("rentwise_token", authToken);

    // If user just analyzed an agreement as a guest, link & save it to their account now
    if (result?.document_id && !result.saved_to_account) {
      try {
        await saveAgreementToAccount(authToken, {
          document_id: result.document_id,
          filename: result.filename || "Rental Agreement",
          location: result.location || initialLocation || "",
          analysis: result,
        });
        setResult((prev) => (prev ? { ...prev, saved_to_account: true } : prev));
      } catch {
        // Non-blocking
      }
    }

    if (authModal.pendingNav) {
      if (authModal.pendingNav === "customer") {
        setCustomerSection(authModal.pendingCustomerSection || "overview");
      }
      navTo(authModal.pendingNav);
    } else if (loggedInUser.role === "broker") {
      navTo("broker");
    } else {
      setCustomerSection(authModal.pendingCustomerSection || "overview");
      navTo("customer");
    }
  };

  const handleLogout = async () => {
    if (token) {
      await logoutUser(token);
    }
    setUser(null);
    setToken("");
    localStorage.removeItem("rentwise_user");
    localStorage.removeItem("rentwise_token");
    setLandingAuthConfig({ mode: "login", targetRole: "customer", contextMessage: "" });
    setPage("auth");
  };

  const goAnalyzer = (location = "") => {
    setError("");
    setInitialLocation(location);
    setPage("analyzer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navTo = (dest) => {
    setError("");
    setPage(dest);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navToProtected = (dest, section = "overview") => {
    if (dest === "auth" || dest === "home") {
      if (!user) {
        navTo("auth");
      } else {
        navTo(user.role === "broker" ? "broker" : "customer");
      }
      return;
    }
    if (dest === "customer") {
      if (!user) {
        setLandingAuthConfig({
          mode: "login",
          targetRole: "customer",
          contextMessage: "Please login or register with User Login before opening the Customer Dashboard.",
        });
        navTo("auth");
        return;
      }
      if (user.role !== "customer") {
        openAuthModal(
          "login",
          "customer",
          "customer",
          "You are currently signed in as a Broker. Switch to a Customer / General User account to open the Customer Dashboard.",
          section
        );
        return;
      }
      setCustomerSection(section);
    } else if (dest === "broker") {
      if (!user) {
        setLandingAuthConfig({
          mode: "login",
          targetRole: "broker",
          contextMessage: "Please login or register with Broker Login before opening the Broker Portal.",
        });
        navTo("auth");
        return;
      }
      if (user.role !== "broker") {
        openAuthModal(
          "login",
          "broker",
          "broker",
          "You are currently signed in as a Customer. Switch to a Licensed Broker account to open the Broker Portal."
        );
        return;
      }
    }
    navTo(dest);
  };

  const canShowCustomerDashboard = page === "customer" && user && user.role === "customer";
  const canShowBrokerDashboard = page === "broker" && user && user.role === "broker";
  const showAuthGate =
    page === "auth" ||
    (page === "customer" && (!user || user.role !== "customer")) ||
    (page === "broker" && (!user || user.role !== "broker"));

  return (
    <div className="app">
      <Header
        activePage={showAuthGate ? "auth" : page}
        onNav={(dest, section) => navToProtected(dest, section)}
        onStart={() => goAnalyzer()}
        user={user}
        onUserLoginClick={() => {
          setLandingAuthConfig({ mode: "login", targetRole: "customer", contextMessage: "" });
          navTo("auth");
        }}
        onRegisterClick={() => {
          setLandingAuthConfig({ mode: "signup", targetRole: "customer", contextMessage: "" });
          navTo("auth");
        }}
        onLogout={handleLogout}
        onSwitchAccount={() =>
          openAuthModal("login", user?.role === "customer" ? "broker" : "customer")
        }
      />

      {showAuthGate && (
        <AuthLandingPage
          initialMode={landingAuthConfig.mode}
          targetRole={landingAuthConfig.targetRole}
          contextMessage={landingAuthConfig.contextMessage}
          onSuccess={handleAuthSuccess}
          onAnalyzeWithoutLogin={() => goAnalyzer()}
        />
      )}

      {canShowCustomerDashboard && (
        <CustomerDashboard
          onAnalyzeAgreement={(city) => goAnalyzer(city)}
          onOpenAgreement={(analysis) => {
            setResult(analysis);
            navTo("results");
          }}
          currentUser={user}
          authToken={token}
          initialSection={customerSection}
          onUserUpdated={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem("rentwise_user", JSON.stringify(updatedUser));
          }}
          onRequireLogin={() => openAuthModal("login", "customer", "customer")}
        />
      )}

      {canShowBrokerDashboard && (
        <BrokerDashboard
          onAnalyzeAgreement={(city) => goAnalyzer(city)}
          currentUser={user}
          onRequireLogin={() => openAuthModal("login", "broker", "broker")}
        />
      )}

      {page === "analyzer" && (
        <AnalyzerPage
          initialLocation={initialLocation}
          token={token}
          user={user}
          onBack={() => navTo(user ? (user.role === "broker" ? "broker" : "customer") : "auth")}
          onLoginToBrowse={() =>
            openAuthModal(
              "login",
              "customer",
              "customer",
              "Already analyzed your agreement? Sign in or register with User Login to explore properties to buy or rent."
            )
          }
          onResult={(data) => {
            setResult(data);
            setPage("results");
          }}
          error={error}
          setError={setError}
        />
      )}

      {page === "results" && (
        <ResultsPage
          result={result}
          user={user}
          onBack={() => setPage("analyzer")}
          onHome={() => navTo(user ? (user.role === "broker" ? "broker" : "customer") : "auth")}
          onCustomerDashboard={(section = "overview") => navToProtected("customer", section)}
          onLoginAndSave={() =>
            openAuthModal(
              "login",
              "customer",
              "customer",
              "Sign in or register with User Login to save this analyzed agreement to My Account and explore properties to buy or rent.",
              "account"
            )
          }
        />
      )}

      {/* Global Auth Modal (used when switching accounts or logging in from Analyzer / Results) */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        targetRole={authModal.targetRole}
        contextMessage={authModal.contextMessage}
        onClose={() => setAuthModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

function Header({
  activePage,
  onNav,
  onStart,
  user,
  onUserLoginClick,
  onRegisterClick,
  onLogout,
  onSwitchAccount,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="nav">
      <button className="brand" onClick={() => onNav("auth")}>
        <span className="brand-mark">
          <FileText size={18} />
          <Check size={12} />
        </span>
        <span>
          Rent<span>Wise</span>
        </span>
      </button>

      <nav className="main-nav-links">
        {!user && (
          <button
            className={`nav-link-btn ${activePage === "auth" ? "active" : ""}`}
            onClick={() => onNav("auth")}
          >
            <LogIn size={15} /> Login / Register
          </button>
        )}
        <button
          className={`nav-link-btn ${activePage === "analyzer" || activePage === "results" ? "active" : ""}`}
          onClick={onStart}
        >
          <FileText size={15} /> Analyze Agreement
        </button>
        {user?.role === "customer" && (
          <button
            className={`nav-link-btn ${activePage === "customer" ? "active" : ""}`}
            onClick={() => onNav("customer")}
          >
            <Building size={15} /> Customer Dashboard
          </button>
        )}
        {user?.role === "broker" && (
          <button
            className={`nav-link-btn ${activePage === "broker" ? "active" : ""}`}
            onClick={() => onNav("broker")}
          >
            <Briefcase size={15} /> Broker Portal
          </button>
        )}
      </nav>

      <div className="nav-actions">
        {user ? (
          <div className="user-menu-wrapper" ref={dropdownRef}>
            <button
              className="user-profile-badge"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Click to view account menu"
            >
              <div className="user-avatar-circle">{initials}</div>
              <div className="user-info-brief">
                <span className="user-name-text">{user.name}</span>
                <span className={`user-role-tag ${user.role}`}>
                  {user.role === "customer" ? "Customer" : "Broker"}
                </span>
              </div>
              <ChevronDown size={14} color="#627d98" />
            </button>

            {menuOpen && (
              <div className="user-dropdown-panel">
                <div className="user-dropdown-header">
                  <b>{user.name}</b>
                  <span>{user.email}</span>
                  {user.agency_name && (
                    <div className="user-dropdown-agency">🏢 {user.agency_name}</div>
                  )}
                </div>

                {user.role === "customer" ? (
                  <>
                    <button
                      className="user-dropdown-action"
                      onClick={() => {
                        setMenuOpen(false);
                        onNav("customer", "overview");
                      }}
                    >
                      <Building size={15} /> Customer Dashboard
                    </button>
                    <button
                      className="user-dropdown-action"
                      onClick={() => {
                        setMenuOpen(false);
                        onNav("customer", "account");
                      }}
                    >
                      <User size={15} /> My Account & Saved
                    </button>
                  </>
                ) : (
                  <button
                    className="user-dropdown-action"
                    onClick={() => {
                      setMenuOpen(false);
                      onNav("broker");
                    }}
                  >
                    <Briefcase size={15} /> Go to Broker Portal
                  </button>
                )}

                <button
                  className="user-dropdown-action"
                  onClick={() => {
                    setMenuOpen(false);
                    onSwitchAccount();
                  }}
                >
                  <Users size={15} /> Switch / Change Account
                </button>

                <button
                  className="user-dropdown-action logout"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="nav-auth-group">
            <button className="nav-login-btn" onClick={onUserLoginClick}>
              <LogIn size={14} /> Login
            </button>
            <button className="nav-signup-btn" onClick={onRegisterClick}>
              <User size={14} /> Register
            </button>
          </div>
        )}

        <button className="nav-cta" onClick={onStart}>
          Analyze Agreement <ArrowRight size={16} />
        </button>
      </div>
    </header>
  );
}

function AuthLandingPage({
  initialMode,
  targetRole,
  contextMessage,
  onSuccess,
  onAnalyzeWithoutLogin,
}) {
  return (
    <>
      <main className="auth-landing-page">
        <div className="auth-landing-grid">
          <section className="auth-landing-info">
            <div className="eyebrow">
              <ShieldCheck size={15} /> RentWise – Secure Authentication
            </div>
            <h1>
              Login or Register before accessing <em>Dashboards</em>
            </h1>
            <p className="auth-landing-sub">
              Welcome to your rental and property platform. Choose <b>Customer / General User</b> to buy or rent homes and manage saved agreements, or <b>Licensed Broker</b> to match client leads.
            </p>

            <div className="auth-guest-card">
              <div className="auth-guest-icon">
                <FileText size={22} />
              </div>
              <div className="auth-guest-copy">
                <span className="portal-tag">NO ACCOUNT NEEDED</span>
                <h2>Analyze Rental Agreement First?</h2>
                <p>
                  You do not need a separate account just to analyze a rental agreement. Upload any PDF or DOCX to check clauses and risks, then sign in later if you want to buy or rent.
                </p>
              </div>
              <button
                type="button"
                className="primary-btn"
                onClick={onAnalyzeWithoutLogin}
              >
                Analyze Agreement (No Login Needed) <ArrowRight size={16} />
              </button>
            </div>

            <div className="auth-portal-highlights">
              <div className="auth-highlight-item">
                <Building size={18} />
                <div>
                  <b>Customer Dashboard</b>
                  <span>Analyze Agreement, Buy a Property, Rent a Property, and My Account.</span>
                </div>
              </div>
              <div className="auth-highlight-item">
                <Briefcase size={18} />
                <div>
                  <b>Broker Dashboard</b>
                  <span>Client requirement matching, compatibility scores, and lead management.</span>
                </div>
              </div>
            </div>
          </section>

          <section className="auth-landing-card-wrap">
            <AuthPanel
              initialMode={initialMode}
              targetRole={targetRole}
              contextMessage={contextMessage}
              onSuccess={onSuccess}
            />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function AnalyzerPage({ initialLocation, token, user, onBack, onLoginToBrowse, onResult, error, setError }) {
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState(initialLocation || "");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await uploadAgreement(file, location, token);
      onResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function choose(e) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  return (
    <>
      <main className="analyzer">
        <div className="analyzer-subnav">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> {user ? "Back to Dashboard" : "Back to Login / Register"}
          </button>
        </div>

        <div className="product-heading">
          <span className="section-label">DOCUMENT ANALYZER</span>
          <h1>Analyze your rental agreement</h1>
          <p>Upload your PDF or DOCX agreement — no separate account required.</p>
        </div>

        {!user && (
          <div className="guest-login-link-banner">
            <div className="guest-banner-copy">
              <ShieldCheck size={18} />
              <div>
                <b>No account needed to analyze your file.</b>
                <span> Want to buy or rent a property, or save this agreement to My Account?</span>
              </div>
            </div>
            <button type="button" className="portal-role-switch-btn" onClick={onLoginToBrowse}>
              <User size={14} /> User Login (Buy / Rent)
            </button>
          </div>
        )}

        {busy ? (
          <div className="processing">
            <div className="loader">
              <LoaderCircle size={38} />
            </div>
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
            <div
              className={"upload-box " + (drag ? "dragging" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
            >
              <div className="upload-icon">
                <UploadCloud size={30} />
              </div>
              <h2>Drop your agreement here</h2>
              <p>or</p>
              <label className="browse">
                Browse your files
                <input type="file" accept=".pdf,.docx" onChange={choose} />
              </label>
              <small>PDF or DOCX</small>
            </div>
            <div className="upload-help">
              <ShieldCheck size={18} />
              <div>
                <b>Private by design</b>
                <span>
                  {user
                    ? "Signed in — this analysis will also be saved to My Account."
                    : "Your document is processed only for this analysis."}
                </span>
              </div>
            </div>
            <label className="location-field">
              <span>
                Property city or location <small>Optional, used for market estimates</small>
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Pune or Bengaluru"
              />
            </label>
          </div>
        )}

        {file && !busy && (
          <div className="selected-file">
            <div className="selected-icon">
              <FileText size={21} />
            </div>
            <div className="selected-info">
              <b>{file.name}</b>
              <span>{formatBytes(file.size)}</span>
            </div>
            <button onClick={() => setFile(null)} aria-label="Remove file">
              <X size={17} />
            </button>
            <button className="primary-btn compact" onClick={analyze}>
              Analyze Agreement <ArrowRight size={17} />
            </button>
          </div>
        )}
        {error && (
          <div className="error-box">
            <AlertTriangle size={18} />
            <div>
              <b>We couldn't analyze that document.</b>
              <span>{error}</span>
            </div>
          </div>
        )}
        <p className="disclaimer">
          RentWise provides general information and simplified explanations. It does not provide professional legal advice.
        </p>
      </main>
    </>
  );
}

function ResultsPage({ result, user, onBack, onHome, onCustomerDashboard, onLoginAndSave }) {
  const [active, setActive] = useState("Rent");
  const info = result?.information || {};
  const clause = (result?.clauses || []).find((c) => c.category === active);

  return (
    <>
      <main className="results">
        <div className="analyzer-subnav">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Analyze another agreement
          </button>
        </div>

        <div className="result-head">
          <div>
            <span className="section-label">ANALYSIS COMPLETE</span>
            <h1>Your Agreement at a Glance</h1>
            <p>Here's what we found in your rental agreement.</p>
          </div>
          <div className="result-file">
            <FileText size={18} />
            <span>{result?.filename || "Rental Agreement"}</span>
            <Check size={17} />
          </div>
        </div>

        {!user ? (
          <div className="guest-next-step-card">
            <div className="guest-next-step-copy">
              <div className="guest-next-icon">
                <Home size={20} />
              </div>
              <div>
                <b>Ready to Buy or Rent a Home, or Save This Agreement?</b>
                <p>
                  Sign in with <b>User Login</b> to save this analysis to <b>My Account</b> and explore properties available to buy or rent.
                </p>
              </div>
            </div>
            <div className="guest-next-actions">
              <button type="button" className="primary-btn compact" onClick={onLoginAndSave}>
                <User size={15} /> User Login (Buy / Rent & Save)
              </button>
            </div>
          </div>
        ) : (
          <div className="guest-next-step-card logged-in">
            <div className="guest-next-step-copy">
              <div className="guest-next-icon">
                <Check size={20} />
              </div>
              <div>
                <b>Saved to Your RentWise Account</b>
                <p>
                  {result?.saved_to_account
                    ? "This agreement has been added to My Account → Saved Agreements."
                    : "Explore properties available to buy or rent, or open My Account."}
                </p>
              </div>
            </div>
            <div className="guest-next-actions">
              <button type="button" className="filter-chip" onClick={() => onCustomerDashboard("buy")}>
                <Tag size={14} /> Buy a Property
              </button>
              <button type="button" className="filter-chip" onClick={() => onCustomerDashboard("rent")}>
                <Key size={14} /> Rent a Property
              </button>
              <button type="button" className="primary-btn compact" onClick={() => onCustomerDashboard("account")}>
                <User size={14} /> My Account
              </button>
            </div>
          </div>
        )}

        {result?.scanned && (
          <div className="info-box">
            <AlertTriangle size={18} />
            <span>This document appears to be scanned. OCR support will be added in a future version.</span>
          </div>
        )}

        <div className="info-grid">
          <InfoCard icon={Home} label="MONTHLY RENT" value={formatMoney(info.monthly_rent)} sub="per month" />
          <InfoCard icon={ShieldCheck} label="SECURITY DEPOSIT" value={formatMoney(info.security_deposit)} />
          <InfoCard icon={Clock3} label="NOTICE PERIOD" value={info.notice_period} />
          <InfoCard icon={Lock} label="LOCK-IN PERIOD" value={info.lock_in_period} />
          <InfoCard icon={FileText} label="AGREEMENT DURATION" value={info.agreement_duration} />
          <InfoCard icon={Wrench} label="MAINTENANCE" value={info.maintenance} />
          <InfoCard icon={AlertTriangle} label="PENALTY" value={info.penalty} />
        </div>

        <RentForecast forecast={info.rent_forecast} />

        <section className="attention">
          <div className="attention-title">
            <span>
              <AlertTriangle size={19} />
            </span>
            <div>
              <h2>Things You Should Know</h2>
              <p>Important points detected from the agreement.</p>
            </div>
          </div>
          <div className="attention-grid">
            {buildAttention(info, result?.clauses).map((x, i) => (
              <div className="attention-card" key={i}>
                <Check size={17} />
                <span>{x}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="clauses">
          <div className="section-heading">
            <span>EXPLORE AGREEMENT CLAUSES</span>
            <h2>Find details by category.</h2>
          </div>
          <div className="category-tabs">
            {categories.map(([name, Icon]) => (
              <button
                className={active === name ? "active" : ""}
                onClick={() => setActive(name)}
                key={name}
              >
                <Icon size={17} />
                {name}
              </button>
            ))}
          </div>
          <div className="clause-panel">
            <div className="clause-label">
              <span>{active.toUpperCase()}</span>
              <b>{clause?.clauses?.length || 0} detected</b>
            </div>
            {clause?.clauses?.length ? (
              clause.clauses.map((item, i) => (
                <ClauseItem item={item} category={active} key={i} />
              ))
            ) : (
              <div className="empty-clause">No matching clause was found for this category.</div>
            )}
          </div>
        </section>

        <RiskSection risks={result?.risks || []} fairness={result?.fairness} />
        <ChatPanel documentId={result?.document_id} />
        <ChecklistPanel documentId={result?.document_id} />
        <ComparePanel documentId={result?.document_id} />

        <section className="summary">
          <div className="summary-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="section-label">BASIC AGREEMENT SUMMARY</span>
            <h2>What RentWise found</h2>
            <p>{result?.summary}</p>
            <small>This is a rule-based summary for the current project phase, not advanced AI-generated legal advice.</small>
          </div>
        </section>

        <section className="coming">
          <div className="section-heading">
            <span>AVAILABLE TOOLS</span>
            <h2>More clarity for your agreement.</h2>
          </div>
          <RoadmapFeatures />
        </section>
      </main>
      <Footer />
    </>
  );
}

function InfoCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="info-card">
      <div className="info-icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value || "Not Found"}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function RentForecast({ forecast }) {
  const contractual = forecast?.contractual;
  const market = forecast?.market_estimate;
  if (!contractual && !market) return null;
  return (
    <section className="rent-forecast">
      <div className="forecast-heading">
        <div className="forecast-icon">
          <CircleDollarSign size={19} />
        </div>
        <div>
          <span className="section-label">RENT INCREASE PREDICTOR</span>
          <h2>Plan for what rent could cost next.</h2>
        </div>
      </div>
      <div className="forecast-grid">
        {contractual && (
          <div className="forecast-card exact">
            <span>CONTRACTUAL INCREASE</span>
            <strong>
              {contractual.percentage}% after {formatPeriod(contractual.after_months)}
            </strong>
            <p>
              Estimated future rent: <b>{formatMoney(contractual.future_rent)}</b>
            </p>
            <small>Based on an escalation clause found in your agreement.</small>
          </div>
        )}
        {market && (
          <div className="forecast-card">
            <span>LOCATION-BASED PLANNING ESTIMATE</span>
            <strong>
              {market.location}: {market.annual_low_percent}%–{market.annual_high_percent}% / year
            </strong>
            <p>
              After 12 months: <b>{formatRange(market.after_12_months)}</b>
            </p>
            <p>
              After 24 months: <b>{formatRange(market.after_24_months)}</b>
            </p>
            <small>{market.basis}</small>
          </div>
        )}
      </div>
    </section>
  );
}

function RiskSection({ risks, fairness }) {
  return (
    <section className="risk-section">
      <div className="score-card">
        <div className="score-heading">
          <div className="score-icon">
            <Gauge size={20} />
          </div>
          <div>
            <span className="section-label">FAIRNESS SCORE</span>
            <h2>
              {fairness?.score ?? 0}
              <small>/100</small>
            </h2>
            <p>{fairness?.label || "Needs review"}</p>
          </div>
        </div>
        <div className="score-bar">
          <span style={{ width: `${fairness?.score ?? 0}%` }} />
        </div>
        <div className="factor-list">
          {(fairness?.factors || []).map((factor) => (
            <div className="factor" key={factor.name}>
              <span>{factor.name}</span>
              <b className={factor.status === "Found" ? "found" : "missing"}>
                {factor.status}
              </b>
            </div>
          ))}
        </div>
      </div>
      <div className="risk-card">
        <div className="risk-heading">
          <AlertTriangle size={19} />
          <div>
            <span className="section-label">RISK DETECTION</span>
            <h2>
              {risks.length
                ? `${risks.length} clause${risks.length === 1 ? "" : "s"} to review`
                : "No elevated risks found"}
            </h2>
          </div>
        </div>
        {risks.length ? (
          risks.slice(0, 4).map((risk, i) => (
            <div className="risk-item" key={i}>
              <span className={`risk-dot ${risk.level.toLowerCase()}`}></span>
              <div>
                <b>{risk.level} risk</b>
                <p>{risk.reason}</p>
                <small>“{risk.clause}”</small>
              </div>
            </div>
          ))
        ) : (
          <p className="clear-risk">The rule-based review did not detect a high or medium risk signal.</p>
        )}
      </div>
    </section>
  );
}

function ChatPanel({ documentId }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setBusy(true);
    setError("");
    try {
      setAnswer(await askAgreement(documentId, question));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="chat-panel">
      <div className="chat-title">
        <div className="chat-icon">
          <MessageCircle size={20} />
        </div>
        <div>
          <span className="section-label">ASK YOUR AGREEMENT</span>
          <h2>Have a question?</h2>
          <p>Answers are limited to the uploaded document.</p>
        </div>
      </div>
      <form onSubmit={ask} className="chat-form">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Who is responsible for repairs?"
          aria-label="Ask a question about the agreement"
        />
        <button className="primary-btn compact" disabled={busy}>
          {busy ? "Thinking..." : "Ask"} <Send size={16} />
        </button>
      </form>
      {error && <p className="chat-error">{error}</p>}
      {answer && (
        <div className="chat-answer">
          <b>RentWise found:</b>
          <p>{answer.answer}</p>
          {answer.sources?.length > 0 && (
            <small>Source text is quoted from your uploaded agreement.</small>
          )}
        </div>
      )}
    </section>
  );
}

function ClauseItem({ item, category }) {
  const [explanation, setExplanation] = useState(null);
  const [busy, setBusy] = useState(false);

  async function explain() {
    setBusy(true);
    try {
      setExplanation(await explainClause(item.text, category));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="clause">
      <div className="clause-meta">
        <span className={`risk-dot ${item.risk.toLowerCase()}`}></span>
        <b>{item.risk} risk</b>
      </div>
      <p>“{item.text}”</p>
      <small>{item.reason}</small>
      <button className="explain-btn" onClick={explain} disabled={busy}>
        <Sparkles size={13} />
        {busy ? "Explaining..." : "Explain simply"}
      </button>
      {explanation && (
        <div className="explanation">
          <b>In simple words</b>
          <p>{explanation.plain_language}</p>
          <small>Questions to ask: {explanation.questions_to_ask.join(" ")}</small>
        </div>
      )}
    </div>
  );
}

function ChecklistPanel({ documentId }) {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      setItems((await getChecklist(documentId)).items);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tool-panel">
      <div className="tool-heading">
        <div className="tool-icon">
          <Check size={19} />
        </div>
        <div>
          <span className="section-label">SMART TENANT CHECKLIST</span>
          <h2>Know what to verify before signing.</h2>
        </div>
        <button className="primary-btn compact" onClick={load} disabled={busy}>
          {busy ? "Building..." : items ? "Refresh" : "Build checklist"}
        </button>
      </div>
      {items && (
        <div className="checklist">
          {items.map((item) => (
            <div className="check-item" key={item.text}>
              <span className={item.status === "Found" ? "found" : "check"}>
                {item.status === "Found" ? <Check size={13} /> : ""}
              </span>
              <span>{item.text}</span>
              <small>{item.status === "Found" ? "Mentioned" : "Verify"}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ComparePanel({ documentId }) {
  const [comparison, setComparison] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function compare(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setComparison(await compareAgreement(documentId, file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <section className="tool-panel">
      <div className="tool-heading">
        <div className="tool-icon">
          <Search size={19} />
        </div>
        <div>
          <span className="section-label">AGREEMENT COMPARISON</span>
          <h2>Compare another agreement side by side.</h2>
        </div>
        <label className="browse compact">
          {busy ? "Comparing..." : "Choose agreement"}
          <input type="file" accept=".pdf,.docx" onChange={compare} disabled={busy} />
        </label>
      </div>
      {error && <p className="chat-error">{error}</p>}
      {comparison && (
        <div className="comparison">
          <div className="compare-header">
            <b>Current agreement</b>
            <b>{comparison.filename || "Second agreement"}</b>
          </div>
          {comparison.fields.map((field) => (
            <div className="compare-row" key={field.label}>
              <span>{field.label}</span>
              <b>{field.first}</b>
              <b className={field.match ? "same" : "different"}>{field.second}</b>
            </div>
          ))}
          <div className="score-compare">
            <span>Fairness score</span>
            <b>{comparison.first_score}/100</b>
            <b>{comparison.second_score}/100</b>
          </div>
        </div>
      )}
    </section>
  );
}

function Value({ icon: Icon, title, text }) {
  return (
    <div className="value">
      <span>
        <Icon size={19} />
      </span>
      <div>
        <b>{title}</b>
        <small>{text}</small>
      </div>
    </div>
  );
}

function Step({ n, title, text, icon: Icon }) {
  return (
    <div className="step">
      <span className="step-num">{n}</span>
      <div className="step-icon">
        <Icon size={22} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function RoadmapFeatures() {
  return (
    <div className="future-grid">
      {roadmapFeatures.map(([icon, title, text]) => (
        <Future key={title} icon={icon} title={title} text={text} />
      ))}
    </div>
  );
}

function Future({ icon: Icon, title, text }) {
  return (
    <div className="future-card">
      <div className="future-icon">
        <Icon size={19} />
      </div>
      <div>
        <h3>
          {title}
          <span>AVAILABLE NOW</span>
        </h3>
        <p>{text}</p>
      </div>
      <Check className="available-icon" size={16} />
    </div>
  );
}

function Process({ text, done, active }) {
  return (
    <div className={"process " + (done ? "done " : "") + (active ? "active" : "")}>
      <span>{done ? <Check size={13} /> : active ? <LoaderCircle size={13} /> : null}</span>
      {text}
    </div>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <span className="brand-mark">
          <FileText size={17} />
          <Check size={11} />
        </span>
        <b>RentWise</b>
      </div>
      <span>RentWise Real Estate & Agreement Intelligence — General information only, not professional legal advice.</span>
    </footer>
  );
}

function buildAttention(info, clauses = []) {
  const arr = [];
  if (info.notice_period !== "Not Found") arr.push(`${info.notice_period} notice is required before leaving.`);
  const maint = clauses.find((x) => x.category === "Maintenance");
  if (maint?.clauses?.length) arr.push("Maintenance responsibilities are mentioned in the agreement.");
  const dep = clauses.find((x) => x.category === "Deposit");
  if (dep?.clauses?.length) arr.push("Security deposit or refund conditions are mentioned.");
  if (!arr.length) arr.push("Review the detected values and clause categories before signing.");
  return arr.slice(0, 3);
}

function formatBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

function formatMoney(v) {
  if (v === undefined || v === null || v === "Not Found") return "Not Found";
  const value = String(v);
  return value.startsWith("₹") ? value : "₹" + value;
}

function formatRange(values) {
  return values?.map((value) => formatMoney(value)).join("–") || "Not Found";
}

function formatPeriod(months) {
  return months % 12 === 0 ? `${months / 12} year${months === 12 ? "" : "s"}` : `${months} months`;
}

createRoot(document.getElementById("root")).render(<App />);
