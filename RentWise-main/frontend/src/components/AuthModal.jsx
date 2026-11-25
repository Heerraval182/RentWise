import React, { useState, useEffect, useRef, useId } from "react";
import {
  X,
  Building,
  Briefcase,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
  Zap,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginUser, signupUser, getDemoAccounts } from "../services/api";

export function AuthPanel({
  initialMode = "login",
  targetRole = "customer",
  contextMessage = "",
  onSuccess,
  onClose,
  titleId,
  autoFocusEmail = false,
}) {
  const [mode, setMode] = useState(initialMode || "login"); // "login" | "signup"
  const [role, setRole] = useState(targetRole || "customer"); // "customer" | "broker"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoAccounts, setDemoAccounts] = useState(null);

  const generatedTitleId = useId();
  const resolvedTitleId = titleId || generatedTitleId;
  const baseId = useId();

  useEffect(() => {
    setMode(initialMode || "login");
    setRole(targetRole || "customer");
    setError("");
    setShowPassword(false);
  }, [initialMode, targetRole]);

  useEffect(() => {
    getDemoAccounts().then((data) => {
      if (data) setDemoAccounts(data);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await loginUser({
          email: email.trim(),
          password,
          expected_role: role,
        });
        onSuccess(res.user, res.token);
        if (onClose) onClose();
      } else {
        if (!name.trim()) throw new Error("Please enter your full name.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");

        const res = await signupUser({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          phone: phone.trim(),
          agency_name: role === "broker" ? agencyName.trim() : "",
        });
        onSuccess(res.user, res.token);
        if (onClose) onClose();
      }
    } catch (err) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickDemo(demoRole) {
    if (!demoAccounts?.[demoRole]) {
      if (demoRole === "customer") {
        setEmail("customer@rentwise.com");
        setPassword("password123");
        setRole("customer");
      } else {
        setEmail("broker@rentwise.com");
        setPassword("password123");
        setRole("broker");
      }
    } else {
      const acc = demoAccounts[demoRole];
      setEmail(acc.email);
      setPassword(acc.password);
      setRole(acc.role);
    }
    setMode("login");
    setError("");
  }

  return (
    <div className="auth-modal">
      {onClose && (
        <button
          type="button"
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Close authentication dialog"
        >
          <X size={20} />
        </button>
      )}

      <div className="auth-header">
        <div className="auth-badge">
          <ShieldCheck size={16} /> RentWise – Secure Authentication
        </div>
        <h1 id={resolvedTitleId} className="auth-title">
          {mode === "login" ? "RentWise – Secure Authentication" : "Create your RentWise account"}
        </h1>
        <p>
          {mode === "login"
            ? "Welcome to your rental and property platform"
            : "Register as a Customer / General User or Licensed Broker"}
        </p>
      </div>

      {/* Explicit Login / Registration Mode Switcher */}
      <div className="auth-mode-switcher" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={`auth-mode-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Login
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`auth-mode-tab ${mode === "signup" ? "active" : ""}`}
          onClick={() => {
            setMode("signup");
            setError("");
          }}
        >
          Registration
        </button>
      </div>

      {contextMessage && (
        <div className="auth-context-banner" role="status">
          <ShieldCheck size={16} />
          <span>{contextMessage}</span>
        </div>
      )}

      {/* Two Main Login Options */}
      <div className="auth-role-tabs" role="group" aria-label="Select login portal">
        <button
          type="button"
          className={`auth-role-btn ${role === "customer" ? "active" : ""}`}
          onClick={() => {
            setRole("customer");
            setError("");
          }}
        >
          <div className="auth-role-icon">
            <Building size={18} />
          </div>
          <div className="auth-role-text">
            <strong>Customer / General User</strong>
            <span>Agreement analysis, property search and rental services.</span>
            <em className="auth-role-pill">User Login</em>
          </div>
          {role === "customer" && <CheckCircle2 size={16} className="auth-check" />}
        </button>

        <button
          type="button"
          className={`auth-role-btn ${role === "broker" ? "active" : ""}`}
          onClick={() => {
            setRole("broker");
            setError("");
          }}
        >
          <div className="auth-role-icon">
            <Briefcase size={18} />
          </div>
          <div className="auth-role-text">
            <strong>Licensed Broker</strong>
            <span>Manage clients, property matching and leads.</span>
            <em className="auth-role-pill broker">Broker Login</em>
          </div>
          {role === "broker" && <CheckCircle2 size={16} className="auth-check" />}
        </button>
      </div>

      {/* 1-Click Demo Buttons */}
      <div className="auth-demo-box">
        <span className="auth-demo-label">
          <Zap size={13} /> Quick 1-Click Demo Logins:
        </span>
        <div className="auth-demo-buttons">
          <button
            type="button"
            className="auth-demo-pill"
            onClick={() => handleQuickDemo("customer")}
            title="Demo Customer / General User (Rahul Sharma)"
          >
            <Building size={12} /> Demo User Login
          </button>
          <button
            type="button"
            className="auth-demo-pill"
            onClick={() => handleQuickDemo("broker")}
            title="Demo Broker (Amit Patel - Metro Prime)"
          >
            <Briefcase size={12} /> Demo Broker Login
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="auth-error-alert" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        {mode === "signup" && (
          <div className="auth-field">
            <label htmlFor={`${baseId}-name`}>Full Name *</label>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input
                id={`${baseId}-name`}
                name="name"
                type="text"
                autoComplete="name"
                enterKeyHint="next"
                required
                placeholder={role === "customer" ? "e.g. Rahul Sharma" : "e.g. Amit Patel"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="auth-field">
          <label htmlFor={`${baseId}-email`}>Email Address *</label>
          <div className="auth-input-wrap">
            <Mail size={16} className="auth-input-icon" />
            <input
              id={`${baseId}-email`}
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              enterKeyHint="next"
              required
              autoFocus={autoFocusEmail}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor={`${baseId}-password`}>Password *</label>
          <div className="auth-input-wrap has-toggle">
            <Lock size={16} className="auth-input-icon" />
            <input
              id={`${baseId}-password`}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              enterKeyHint={mode === "login" ? "done" : "next"}
              minLength={mode === "signup" ? 6 : 1}
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="auth-pw-toggle"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {mode === "signup" && (
          <>
            <div className="auth-field">
              <label htmlFor={`${baseId}-phone`}>Phone Number (Optional)</label>
              <div className="auth-input-wrap">
                <Phone size={16} className="auth-input-icon" />
                <input
                  id={`${baseId}-phone`}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  enterKeyHint={role === "broker" ? "next" : "done"}
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {role === "broker" && (
              <div className="auth-field">
                <label htmlFor={`${baseId}-agency`}>Agency / Real Estate Firm Name (Optional)</label>
                <div className="auth-input-wrap">
                  <Building size={16} className="auth-input-icon" />
                  <input
                    id={`${baseId}-agency`}
                    name="organization"
                    type="text"
                    autoComplete="organization"
                    enterKeyHint="done"
                    placeholder="e.g. Metro Prime Realty Advisors"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle size={18} className="auth-spin" />
              {mode === "login" ? "Signing In..." : "Creating Account..."}
            </>
          ) : (
            <>
              {mode === "login"
                ? role === "customer"
                  ? "User Login (Customer Dashboard)"
                  : "Broker Login (Broker Portal)"
                : `Register as ${role === "customer" ? "Customer / General User" : "Licensed Broker"}`}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="auth-footer-toggle">
        {mode === "login" ? (
          <p>
            Don't have an account yet?{" "}
            <button
              type="button"
              className="auth-link-action"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              Register for free
            </button>
          </p>
        ) : (
          <p>
            Already registered?{" "}
            <button
              type="button"
              className="auth-link-action"
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Login here
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  targetRole = "customer",
  contextMessage = "",
  onSuccess,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback light-dismiss for browsers without native <dialog closedby="any">
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    const outside = (e) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    let pressedOutside = false;
    const onPointerDown = (e) => {
      pressedOutside = outside(e);
    };
    const onPointerUp = (e) => {
      if (pressedOutside && outside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      aria-labelledby={titleId}
      closedby="any"
      onClose={onClose}
    >
      <AuthPanel
        initialMode={initialMode}
        targetRole={targetRole}
        contextMessage={contextMessage}
        onSuccess={onSuccess}
        onClose={onClose}
        titleId={titleId}
        autoFocusEmail={isOpen}
      />
    </dialog>
  );
}
