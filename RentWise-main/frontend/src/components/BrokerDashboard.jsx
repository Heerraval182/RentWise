import React, { useState, useEffect } from "react";
import {
  Search, Users, Sparkles, Building, Key, Tag, Check, CheckCircle2,
  MapPin, Bed, Bath, Layers, Phone, Mail, User, SlidersHorizontal,
  Plus, Trash2, Eye, Share2, Copy, RefreshCw, X, ArrowRight, DollarSign,
  AlertCircle, Briefcase
} from "lucide-react";
import { matchProperties, getBrokerLeads, createBrokerLead, deleteBrokerLead, getProperties } from "../services/api";
import PropertyDetailsModal, { formatPrice } from "./PropertyDetailsModal";

const AMENITIES_LIST = [
  "Lift",
  "Power Backup",
  "24x7 Security",
  "Gym",
  "Swimming Pool",
  "Club House",
  "Reserved Parking",
  "Gas Pipeline",
  "Pet Friendly",
  "Children's Play Area"
];

export default function BrokerDashboard({ onAnalyzeAgreement }) {
  const [activeTab, setActiveTab] = useState("match"); // "match" | "leads" | "all"

  // Matching criteria state
  const [criteria, setCriteria] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    purpose: "rent",
    city: "Pune",
    preferred_localities: "Koregaon Park",
    property_type: "Any",
    bhk: "3 BHK",
    min_budget: "",
    max_budget: "50000",
    furnishing: "Any",
    preferred_amenities: ["Lift", "Power Backup", "Gym"],
    notes: ""
  });

  // Matched results
  const [matchedResults, setMatchedResults] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Saved Leads
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // All Properties catalog
  const [allProperties, setAllProperties] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Modals & notifications
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load leads and initial match on mount
  useEffect(() => {
    loadLeads();
    executeMatch(criteria);
  }, []);

  async function loadLeads() {
    setLeadsLoading(true);
    try {
      const data = await getBrokerLeads();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLeadsLoading(false);
    }
  }

  async function loadAllProperties() {
    setCatalogLoading(true);
    try {
      const data = await getProperties();
      setAllProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCatalogLoading(false);
    }
  }

  // Execute matching algorithm
  async function executeMatch(currentCriteria) {
    setMatchingLoading(true);
    setErrorMsg("");
    try {
      const payload = {
        purpose: currentCriteria.purpose,
        city: currentCriteria.city,
        preferred_localities: currentCriteria.preferred_localities,
        property_type: currentCriteria.property_type,
        bhk: currentCriteria.bhk,
        min_budget: Number(currentCriteria.min_budget) || 0,
        max_budget: Number(currentCriteria.max_budget) || 0,
        furnishing: currentCriteria.furnishing,
        preferred_amenities: currentCriteria.preferred_amenities
      };

      const res = await matchProperties(payload);
      setMatchedResults(res.results || []);
      setHasSearched(true);
    } catch (err) {
      setErrorMsg(err.message || "Failed to find matching properties.");
    } finally {
      setMatchingLoading(false);
    }
  }

  function handleCriteriaChange(field, val) {
    setCriteria((prev) => ({ ...prev, [field]: val }));
  }

  function toggleAmenity(amenity) {
    setCriteria((prev) => {
      const exists = prev.preferred_amenities.includes(amenity);
      const updated = exists
        ? prev.preferred_amenities.filter((a) => a !== amenity)
        : [...prev.preferred_amenities, amenity];
      return { ...prev, preferred_amenities: updated };
    });
  }

  // Handle Find Matches button
  function handleFindMatches(e) {
    if (e) e.preventDefault();
    executeMatch(criteria);
  }

  // Handle Save Lead & Match
  async function handleSaveLeadAndMatch(e) {
    if (e) e.preventDefault();
    if (!criteria.client_name.trim()) {
      setErrorMsg("Please enter the client's name to save this lead.");
      return;
    }

    setMatchingLoading(true);
    setErrorMsg("");
    try {
      const payload = {
        client_name: criteria.client_name.trim(),
        client_phone: criteria.client_phone.trim(),
        client_email: criteria.client_email.trim(),
        purpose: criteria.purpose,
        city: criteria.city,
        preferred_localities: criteria.preferred_localities,
        property_type: criteria.property_type,
        bhk: criteria.bhk,
        min_budget: Number(criteria.min_budget) || 0,
        max_budget: Number(criteria.max_budget) || 0,
        furnishing: criteria.furnishing,
        preferred_amenities: criteria.preferred_amenities,
        notes: criteria.notes.trim()
      };

      const res = await createBrokerLead(payload);
      setLeads((prev) => [res.lead, ...prev]);
      setMatchedResults(res.matched_properties || []);
      setHasSearched(true);
      setToastMsg(`Saved lead for "${criteria.client_name}" and loaded matching properties!`);
      setTimeout(() => setToastMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save client lead.");
    } finally {
      setMatchingLoading(false);
    }
  }

  // Load a saved lead into the match finder
  function handleSelectLead(lead) {
    const updated = {
      client_name: lead.client_name || "",
      client_phone: lead.client_phone || "",
      client_email: lead.client_email || "",
      purpose: lead.purpose || "rent",
      city: lead.city || "Pune",
      preferred_localities: lead.preferred_localities || "",
      property_type: lead.property_type || "Any",
      bhk: lead.bhk || "Any",
      min_budget: lead.min_budget ? String(lead.min_budget) : "",
      max_budget: lead.max_budget ? String(lead.max_budget) : "",
      furnishing: lead.furnishing || "Any",
      preferred_amenities: Array.isArray(lead.preferred_amenities) ? lead.preferred_amenities : [],
      notes: lead.notes || ""
    };

    setCriteria(updated);
    setActiveTab("match");
    executeMatch(updated);
    setToastMsg(`Loaded requirements for "${lead.client_name}"! Showing matching properties.`);
    setTimeout(() => setToastMsg(""), 4000);
  }

  // Delete a saved lead
  async function handleDeleteLead(leadId, clientName, e) {
    e.stopPropagation();
    if (!window.confirm(`Delete saved lead for "${clientName}"?`)) return;
    try {
      await deleteBrokerLead(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setToastMsg(`Removed lead for "${clientName}".`);
      setTimeout(() => setToastMsg(""), 3500);
    } catch (err) {
      alert(err.message || "Failed to delete lead");
    }
  }

  // Generate WhatsApp / Email proposal pitch for the client
  function handleCopyClientPitch(property) {
    const clientGreeting = criteria.client_name ? `Dear ${criteria.client_name}, ` : "Hello, ";
    const isRent = property.listing_type === "rent";
    const priceText = formatPrice(property.price, property.listing_type);
    const depositText = isRent && property.deposit > 0 ? `\n• Security Deposit: ₹${Number(property.deposit).toLocaleString("en-IN")}` : "";
    const amenitiesText = Array.isArray(property.amenities) && property.amenities.length > 0
      ? `\n• Amenities: ${property.amenities.slice(0, 5).join(", ")}`
      : "";

    const pitch = `${clientGreeting}I found an excellent property matching your exact requirements on RentWise:

🏡 ${property.title}
📍 Location: ${property.locality}, ${property.city}
💰 Price/Rent: ${priceText}${depositText}
📐 Configuration: ${property.bhk} • ${property.area_sqft || "Spacious"} sq.ft • ${property.furnishing}
🔑 Available From: ${property.available_from || "Immediate"}${amenitiesText}

👤 Owner Contact: ${property.owner_name} (${property.owner_phone})
${property.image_url ? `📸 Photo: ${property.image_url}` : ""}

Please let me know if you would like me to schedule a visit for you!`;

    navigator.clipboard.writeText(pitch);
    setCopiedId(property.id);
    setToastMsg("Copied property proposal pitch! Ready to paste on WhatsApp or Email.");
    setTimeout(() => {
      setCopiedId(null);
      setToastMsg("");
    }, 4000);
  }

  const isRent = criteria.purpose === "rent";

  return (
    <div className="dashboard-page broker-dashboard">
      {/* Broker Hero */}
      <div className="dashboard-hero broker-hero">
        <div className="hero-content">
          <div className="eyebrow broker-eyebrow">
            <Briefcase size={14} /> Broker & Agent Intelligence Hub
          </div>
          <h1>Instant Property Matcher for Brokers</h1>
          <p>
            Enter what kind of property your customer is looking for, and RentWise directly delivers high-probability matching listings with detailed compatibility scores and instant client proposals.
          </p>

          <div className="broker-tabs-bar">
            <button
              className={`broker-tab-btn ${activeTab === "match" ? "active" : ""}`}
              onClick={() => setActiveTab("match")}
            >
              <Sparkles size={16} /> Live Customer Matcher
            </button>
            <button
              className={`broker-tab-btn ${activeTab === "leads" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("leads");
                loadLeads();
              }}
            >
              <Users size={16} /> Saved Client Leads ({leads.length})
            </button>
            <button
              className={`broker-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("all");
                loadAllProperties();
              }}
            >
              <Building size={16} /> All Property Database
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {toastMsg && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="error-box">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: Live Customer Matcher */}
      {activeTab === "match" && (
        <div className="matcher-layout">
          {/* Left Column: Customer Requirement Input Form */}
          <div className="matcher-form-card">
            <div className="card-header-styled">
              <div className="card-header-icon">
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <h2>Customer Requirement</h2>
                <small>Enter what your client is looking for</small>
              </div>
            </div>

            <form onSubmit={handleFindMatches} className="matcher-form">
              {/* Client Info */}
              <div className="sub-group">
                <span className="sub-group-title">Client Details (Optional)</span>
                <div className="form-group">
                  <label>Customer / Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Aditya & Priya Sharma"
                    value={criteria.client_name}
                    onChange={(e) => handleCriteriaChange("client_name", e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Phone</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98901 22334"
                      value={criteria.client_phone}
                      onChange={(e) => handleCriteriaChange("client_phone", e.target.value)}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={criteria.client_email}
                      onChange={(e) => handleCriteriaChange("client_email", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Requirement Specifications */}
              <div className="sub-group">
                <span className="sub-group-title">Property Criteria</span>

                <div className="form-group">
                  <label>Looking To *</label>
                  <div className="pill-radio-group">
                    <button
                      type="button"
                      className={`pill-radio ${isRent ? "active rent" : ""}`}
                      onClick={() => handleCriteriaChange("purpose", "rent")}
                    >
                      <Key size={14} /> Rent a Property
                    </button>
                    <button
                      type="button"
                      className={`pill-radio ${!isRent ? "active sale" : ""}`}
                      onClick={() => handleCriteriaChange("purpose", "sale")}
                    >
                      <Tag size={14} /> Buy a Property
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Target City *</label>
                    <select
                      value={criteria.city}
                      onChange={(e) => handleCriteriaChange("city", e.target.value)}
                    >
                      <option value="Pune">Pune</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label>Preferred Locality/Areas</label>
                    <input
                      type="text"
                      placeholder="e.g. Koregaon Park, Wakad"
                      value={criteria.preferred_localities}
                      onChange={(e) =>
                        handleCriteriaChange("preferred_localities", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Configuration (BHK)</label>
                    <select
                      value={criteria.bhk}
                      onChange={(e) => handleCriteriaChange("bhk", e.target.value)}
                    >
                      <option value="Any">Any Configuration</option>
                      <option value="1 BHK">1 BHK</option>
                      <option value="2 BHK">2 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="4 BHK">4 BHK</option>
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label>Property Type</label>
                    <select
                      value={criteria.property_type}
                      onChange={(e) => handleCriteriaChange("property_type", e.target.value)}
                    >
                      <option value="Any">Any Property Type</option>
                      <option value="Apartment">Apartment / Flat</option>
                      <option value="Villa / House">Villa / House</option>
                      <option value="Studio / 1RK">Studio / 1RK</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Min Budget (₹)</label>
                    <input
                      type="number"
                      placeholder={isRent ? "e.g. 20000" : "e.g. 10000000"}
                      value={criteria.min_budget}
                      onChange={(e) => handleCriteriaChange("min_budget", e.target.value)}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Max Budget (₹) *</label>
                    <input
                      type="number"
                      placeholder={isRent ? "e.g. 50000" : "e.g. 25000000"}
                      value={criteria.max_budget}
                      onChange={(e) => handleCriteriaChange("max_budget", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Furnishing Preference</label>
                  <select
                    value={criteria.furnishing}
                    onChange={(e) => handleCriteriaChange("furnishing", e.target.value)}
                  >
                    <option value="Any">Any Furnishing</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Semi Furnished">Semi Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Required Amenities</label>
                  <div className="amenity-checkbox-grid mini">
                    {AMENITIES_LIST.map((amenity) => {
                      const selected = criteria.preferred_amenities.includes(amenity);
                      return (
                        <button
                          type="button"
                          key={amenity}
                          className={`amenity-toggle-btn ${selected ? "selected" : ""}`}
                          onClick={() => toggleAmenity(amenity)}
                        >
                          <span className="check-box">{selected && <Check size={11} />}</span>
                          <span>{amenity}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label>Client Special Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Quiet high floor preferred, needs move-in within 15 days, company lease..."
                    value={criteria.notes}
                    onChange={(e) => handleCriteriaChange("notes", e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="matcher-form-actions">
                <button
                  type="submit"
                  className="primary-btn match-submit-btn"
                  disabled={matchingLoading}
                >
                  <Sparkles size={17} />
                  {matchingLoading ? "Matching..." : "Find Matching Properties Directly"}
                </button>

                <button
                  type="button"
                  className="secondary-btn save-lead-btn"
                  onClick={handleSaveLeadAndMatch}
                  disabled={matchingLoading}
                >
                  <Users size={16} /> Save Lead & Match
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Directly Shows Properties According To Customer Details */}
          <div className="matcher-results-column">
            <div className="results-header-card">
              <div className="results-title-row">
                <div>
                  <span className="section-label">LIVE MATCH ENGINE</span>
                  <h2>
                    {matchingLoading ? "Searching Listings..." : `Matched Properties (${matchedResults.length})`}
                  </h2>
                </div>
                <div className="results-badge-count">
                  {matchedResults.length > 0 ? (
                    <span className="count-pill green">
                      <Sparkles size={13} /> {matchedResults.length} Matched
                    </span>
                  ) : (
                    <span className="count-pill gray">0 Matched</span>
                  )}
                </div>
              </div>

              {/* Active criteria chips */}
              <div className="active-criteria-chips">
                <span className="criteria-chip">
                  {isRent ? "🔑 For Rent" : "🏷️ For Buy"}
                </span>
                <span className="criteria-chip">📍 {criteria.city}</span>
                {criteria.preferred_localities && (
                  <span className="criteria-chip">🏙️ {criteria.preferred_localities}</span>
                )}
                {criteria.bhk !== "Any" && (
                  <span className="criteria-chip">🛏️ {criteria.bhk}</span>
                )}
                {criteria.max_budget && (
                  <span className="criteria-chip">
                    💰 Max: ₹{Number(criteria.max_budget).toLocaleString("en-IN")}
                  </span>
                )}
                {criteria.furnishing !== "Any" && (
                  <span className="criteria-chip">🛋️ {criteria.furnishing}</span>
                )}
              </div>
            </div>

            {/* Results List */}
            {matchingLoading ? (
              <div className="matching-spinner-box">
                <RefreshCw size={36} className="spin-icon" />
                <h3>Scanning properties database...</h3>
                <p>Scoring compatibility with client budget, location, BHK, and amenities.</p>
              </div>
            ) : matchedResults.length === 0 ? (
              <div className="empty-state">
                <Search size={44} />
                <h3>No directly matching properties found</h3>
                <p>Try widening the budget range, selecting "Any" configuration, or changing preferred localities.</p>
              </div>
            ) : (
              <div className="matched-properties-list">
                {matchedResults.map((prop) => {
                  const score = prop.match_score || 50;
                  const isHighMatch = score >= 85;
                  const isMedMatch = score >= 65 && score < 85;
                  const scoreClass = isHighMatch ? "high-match" : isMedMatch ? "med-match" : "low-match";
                  const isPropRent = prop.listing_type === "rent";
                  const amenities = Array.isArray(prop.amenities) ? prop.amenities : [];

                  return (
                    <div key={prop.id} className={`matched-card ${scoreClass}`}>
                      {/* Top Match Bar */}
                      <div className="match-score-bar">
                        <div className="score-badge">
                          <Sparkles size={14} />
                          <b>{score}% MATCH</b>
                          <small>
                            {isHighMatch
                              ? "Excellent Fit"
                              : isMedMatch
                              ? "Strong Match"
                              : "Alternative Option"}
                          </small>
                        </div>

                        <div className="match-tags-strip">
                          {(prop.matched_tags || []).slice(0, 4).map((tag, idx) => (
                            <span key={idx} className="match-tag-pill">
                              ✓ {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Main Card Content */}
                      <div className="matched-card-main">
                        <img
                          src={prop.image_url}
                          alt={prop.title}
                          className="matched-thumb"
                        />

                        <div className="matched-info">
                          <div className="matched-price-row">
                            <span className="matched-price">
                              {formatPrice(prop.price, prop.listing_type)}
                            </span>
                            <span
                              className={`badge-pill ${
                                isPropRent ? "rent-pill" : "sale-pill"
                              }`}
                            >
                              {isPropRent ? "RENT" : "SALE"}
                            </span>
                            <span className="badge-pill type-pill">{prop.bhk}</span>
                          </div>

                          <h3 className="matched-title">{prop.title}</h3>

                          <div className="matched-location">
                            <MapPin size={15} />
                            <span>
                              {prop.locality}, {prop.city}
                            </span>
                          </div>

                          <div className="matched-specs">
                            <span>{prop.property_type}</span>
                            <span>•</span>
                            <span>{prop.furnishing}</span>
                            {prop.area_sqft > 0 && (
                              <>
                                <span>•</span>
                                <span>{prop.area_sqft} sq.ft</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{prop.parking}</span>
                          </div>

                          {/* Why this property matches breakdown */}
                          {prop.match_reasons && prop.match_reasons.length > 0 && (
                            <div className="match-reasons-box">
                              <small className="reasons-heading">
                                <b>Why RentWise recommends this for your client:</b>
                              </small>
                              <ul className="reasons-list">
                                {prop.match_reasons.slice(0, 3).map((reason, rIdx) => (
                                  <li key={rIdx}>
                                    <Check size={12} className="reason-check" />
                                    <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Owner & Broker Actions */}
                          <div className="matched-actions-row">
                            <div className="owner-quick-info">
                              <User size={14} />
                              <span>
                                {prop.owner_name} ({prop.owner_phone})
                              </span>
                            </div>

                            <div className="broker-btn-group">
                              <button
                                className={`copy-pitch-btn ${copiedId === prop.id ? "copied" : ""}`}
                                onClick={() => handleCopyClientPitch(prop)}
                                title="Copy pitch ready for WhatsApp or Email"
                              >
                                {copiedId === prop.id ? (
                                  <>
                                    <Check size={14} /> Copied Proposal!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={14} /> Copy Client Pitch
                                  </>
                                )}
                              </button>

                              <button
                                className="view-prop-btn"
                                onClick={() => setSelectedProperty(prop)}
                              >
                                <Eye size={15} /> View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Saved Client Leads */}
      {activeTab === "leads" && (
        <div className="leads-tab-view">
          <div className="leads-view-header">
            <div>
              <h2>Saved Customer Leads & Preferences</h2>
              <p>Click any customer requirement to immediately display live matching properties.</p>
            </div>
            <button
              className="primary-btn compact"
              onClick={() => {
                setCriteria({
                  client_name: "",
                  client_phone: "",
                  client_email: "",
                  purpose: "rent",
                  city: "Pune",
                  preferred_localities: "",
                  property_type: "Any",
                  bhk: "2 BHK",
                  min_budget: "",
                  max_budget: "",
                  furnishing: "Any",
                  preferred_amenities: ["Lift", "Power Backup"],
                  notes: ""
                });
                setActiveTab("match");
              }}
            >
              <Plus size={16} /> New Client Requirement
            </button>
          </div>

          {leadsLoading ? (
            <div className="loading-state">
              <RefreshCw size={28} className="spin-icon" />
              <p>Loading client leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="empty-state">
              <Users size={44} />
              <h3>No saved client requirements yet</h3>
              <p>Go to the Live Matcher tab, enter a customer's criteria, and click "Save Lead & Match".</p>
            </div>
          ) : (
            <div className="leads-grid">
              {leads.map((lead) => {
                const isLeadRent = lead.purpose === "rent";
                return (
                  <div
                    key={lead.id}
                    className="lead-card"
                    onClick={() => handleSelectLead(lead)}
                  >
                    <div className="lead-card-header">
                      <div className="lead-avatar">
                        <User size={18} />
                      </div>
                      <div className="lead-title-box">
                        <h3>{lead.client_name}</h3>
                        <small>{lead.client_phone || "No phone provided"}</small>
                      </div>
                      <span className={`badge-pill ${isLeadRent ? "rent-pill" : "sale-pill"}`}>
                        {isLeadRent ? "LOOKING TO RENT" : "LOOKING TO BUY"}
                      </span>
                    </div>

                    <div className="lead-criteria-summary">
                      <div className="crit-item">
                        <MapPin size={14} />
                        <span>
                          {lead.city} {lead.preferred_localities ? `(${lead.preferred_localities})` : ""}
                        </span>
                      </div>
                      <div className="crit-item">
                        <Bed size={14} />
                        <span>{lead.bhk} • {lead.property_type}</span>
                      </div>
                      <div className="crit-item">
                        <DollarSign size={14} />
                        <span>
                          Budget: {lead.max_budget ? `Up to ₹${Number(lead.max_budget).toLocaleString("en-IN")}` : "Flexible"}
                        </span>
                      </div>
                    </div>

                    {lead.notes && (
                      <p className="lead-notes">
                        <b>Notes:</b> {lead.notes}
                      </p>
                    )}

                    <div className="lead-card-footer">
                      <button
                        className="match-now-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectLead(lead);
                        }}
                      >
                        <Sparkles size={14} /> Show Matching Properties
                      </button>
                      <button
                        className="delete-lead-btn"
                        title="Delete Lead"
                        onClick={(e) => handleDeleteLead(lead.id, lead.client_name, e)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: All Property Database */}
      {activeTab === "all" && (
        <div className="all-catalog-tab-view">
          <div className="leads-view-header">
            <div>
              <h2>All Available Properties Catalogue</h2>
              <p>Explore all properties listed by customers across India.</p>
            </div>
            <button className="secondary-btn compact" onClick={loadAllProperties}>
              <RefreshCw size={15} /> Refresh Catalogue
            </button>
          </div>

          {catalogLoading ? (
            <div className="loading-state">
              <RefreshCw size={28} className="spin-icon" />
              <p>Loading catalogue...</p>
            </div>
          ) : (
            <div className="properties-grid">
              {allProperties.map((prop) => (
                <div key={prop.id} className="property-card">
                  <div className="card-media">
                    <img src={prop.image_url} alt={prop.title} className="card-thumb" />
                    <div className="card-overlay-top">
                      <span className={`badge-pill ${prop.listing_type === "rent" ? "rent-pill" : "sale-pill"}`}>
                        {prop.listing_type === "rent" ? "FOR RENT" : "FOR SALE"}
                      </span>
                      <span className={`badge-pill status-${prop.status}`}>
                        {prop.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="card-overlay-bottom">
                      <strong className="card-price">
                        {formatPrice(prop.price, prop.listing_type)}
                      </strong>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="card-meta">
                      <span className="bhk-badge">{prop.bhk}</span>
                      <span className="type-badge">{prop.property_type}</span>
                    </div>
                    <h3 className="card-title">{prop.title}</h3>
                    <div className="card-location">
                      <MapPin size={15} />
                      <span>{prop.locality}, {prop.city}</span>
                    </div>
                    <div className="card-footer">
                      <div className="owner-mini">
                        <small>Owner:</small>
                        <b>{prop.owner_name}</b>
                      </div>
                      <div className="card-actions">
                        <button
                          className="copy-pitch-btn compact"
                          onClick={() => handleCopyClientPitch(prop)}
                          title="Copy proposal pitch"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="action-icon-btn view"
                          onClick={() => setSelectedProperty(prop)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onAnalyzeAgreement={onAnalyzeAgreement}
        />
      )}
    </div>
  );
}
