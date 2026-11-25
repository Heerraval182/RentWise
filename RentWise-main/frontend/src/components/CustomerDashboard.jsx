import React, { useState, useEffect, useId } from "react";
import {
  Plus, Search, Home, Bed, Bath, Layers, MapPin, Phone,
  Trash2, Eye, CheckCircle2, AlertCircle, Building, Key,
  Tag, RefreshCw, X, Check, ArrowRight, FileText, Bookmark,
  User, ShieldCheck, Gauge, Sparkles, Edit3
} from "lucide-react";
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getSavedProperties,
  savePropertyToAccount,
  removeSavedPropertyFromAccount,
  getSavedAgreements,
  deleteSavedAgreement,
  updateUserProfile,
} from "../services/api";
import PropertyDetailsModal, { formatPrice } from "./PropertyDetailsModal";

const AMENITY_OPTIONS = [
  "Lift",
  "Power Backup",
  "24x7 Security",
  "Gym",
  "Swimming Pool",
  "Club House",
  "Reserved Parking",
  "Gas Pipeline",
  "Pet Friendly",
  "Children's Play Area",
  "Gated Community",
  "High Speed Internet",
  "Solar Water Heating",
  "Private Garden"
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
];

export default function CustomerDashboard({
  onAnalyzeAgreement,
  onOpenAgreement,
  currentUser,
  authToken,
  onUserUpdated,
  onRequireLogin,
  initialSection = "overview",
}) {
  // "overview" | "buy" | "rent" | "account"
  const [activeSection, setActiveSection] = useState(initialSection);
  const [accountTab, setAccountTab] = useState("agreements"); // "profile" | "saved" | "agreements" | "listings"

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Account data
  const [savedIds, setSavedIds] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [savedAgreements, setSavedAgreements] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);

  // Profile form state
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Filters
  const [cityFilter, setCityFilter] = useState("all");
  const [bhkFilter, setBhkFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDefaultListingType, setAddDefaultListingType] = useState("rent");
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    setActiveSection(initialSection || "overview");
  }, [initialSection]);

  useEffect(() => {
    setProfileName(currentUser?.name || "");
    setProfilePhone(currentUser?.phone || "");
  }, [currentUser]);

  async function loadProperties() {
    setLoading(true);
    setError("");
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (err) {
      setError(err.message || "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAccountData() {
    if (!authToken) {
      setSavedIds([]);
      setSavedProperties([]);
      setSavedAgreements([]);
      return;
    }
    setAccountLoading(true);
    try {
      const [savedRes, agreementsRes] = await Promise.all([
        getSavedProperties(authToken),
        getSavedAgreements(authToken),
      ]);
      setSavedIds(savedRes.saved_ids || []);
      setSavedProperties(savedRes.properties || []);
      setSavedAgreements(agreementsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAccountLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadAccountData();
  }, [authToken, currentUser?.id]);

  function showToast(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  }

  // Toggle Save Property
  async function handleToggleSave(propertyId) {
    if (!authToken || !currentUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    const currentlySaved = savedIds.includes(propertyId);
    try {
      if (currentlySaved) {
        const res = await removeSavedPropertyFromAccount(authToken, propertyId);
        setSavedIds(res.saved_ids || []);
        setSavedProperties((prev) => prev.filter((p) => p.id !== propertyId));
        showToast("Removed property from Saved Properties.");
      } else {
        const res = await savePropertyToAccount(authToken, propertyId);
        setSavedIds(res.saved_ids || []);
        const matchedProp = properties.find((p) => p.id === propertyId);
        if (matchedProp) {
          setSavedProperties((prev) => [matchedProp, ...prev.filter((p) => p.id !== propertyId)]);
        }
        showToast("Property saved to My Account!");
      }
    } catch (err) {
      setError(err.message || "Failed to update saved properties.");
    }
  }

  // Delete saved agreement
  async function handleDeleteAgreement(agreement) {
    if (!authToken) return;
    if (!window.confirm(`Remove "${agreement.filename}" from your saved agreements?`)) return;
    try {
      await deleteSavedAgreement(authToken, agreement.id);
      setSavedAgreements((prev) => prev.filter((a) => a.id !== agreement.id));
      showToast(`Removed "${agreement.filename}" from My Account.`);
    } catch (err) {
      setError(err.message || "Failed to remove agreement.");
    }
  }

  // Save profile
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!authToken) return;
    setProfileSaving(true);
    setError("");
    try {
      const res = await updateUserProfile(authToken, {
        name: profileName,
        phone: profilePhone,
      });
      if (onUserUpdated && res.user) {
        onUserUpdated(res.user);
      }
      showToast("Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  // Toggle status
  async function handleToggleStatus(property) {
    const nextStatus =
      property.status === "available"
        ? property.listing_type === "rent"
          ? "rented"
          : "sold"
        : "available";

    try {
      const updated = await updateProperty(property.id, { status: nextStatus });
      setProperties((prev) => prev.map((item) => (item.id === property.id ? updated : item)));
      showToast(`Status updated for "${property.title}" to ${nextStatus.toUpperCase()}`);
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  }

  // Delete property
  async function handleDelete(property) {
    if (!window.confirm(`Are you sure you want to remove the listing "${property.title}"?`)) return;
    try {
      await deleteProperty(property.id);
      setProperties((prev) => prev.filter((p) => p.id !== property.id));
      setSavedProperties((prev) => prev.filter((p) => p.id !== property.id));
      showToast(`Property "${property.title}" was removed.`);
    } catch (err) {
      alert(err.message || "Failed to delete property.");
    }
  }

  // Filtered properties depending on section
  const activeListingType =
    activeSection === "buy" ? "sale" : activeSection === "rent" ? "rent" : "all";

  const filteredProperties = properties.filter((p) => {
    if (activeListingType !== "all" && p.listing_type !== activeListingType) return false;
    if (cityFilter !== "all" && (p.city || "").toLowerCase() !== cityFilter.toLowerCase()) return false;
    if (bhkFilter !== "all" && !(p.bhk || "").toLowerCase().includes(bhkFilter.toLowerCase())) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        (p.title || "").toLowerCase().includes(q) ||
        (p.locality || "").toLowerCase().includes(q) ||
        (p.city || "").toLowerCase().includes(q) ||
        (p.bhk || "").toLowerCase().includes(q) ||
        (p.owner_name || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Stats
  const rentCount = properties.filter((p) => p.listing_type === "rent" && p.status === "available").length;
  const saleCount = properties.filter((p) => p.listing_type === "sale" && p.status === "available").length;
  const myListings = currentUser
    ? properties.filter(
        (p) =>
          (p.owner_email && currentUser.email && p.owner_email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (p.owner_name && currentUser.name && p.owner_name.toLowerCase() === currentUser.name.toLowerCase())
      )
    : [];

  return (
    <div className="dashboard-page customer-dashboard">
      {/* Top Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="eyebrow">
            <Building size={14} /> Customer Dashboard
            {currentUser && (
              <span style={{ marginLeft: "8px", fontWeight: 700, color: "#6ee7b7" }}>
                • Welcome, {currentUser.name}
              </span>
            )}
          </div>
          <h1>Customer Dashboard</h1>
          <p>
            Analyze rental agreements, explore properties available to buy or rent, and manage your saved homes and agreements in one place.
          </p>
        </div>
      </div>

      {/* Primary Customer Hub Options */}
      <section className="customer-hub-grid" aria-label="Customer Dashboard Options">
        <button
          type="button"
          className="customer-hub-card analyzer"
          onClick={() => onAnalyzeAgreement("")}
        >
          <div className="hub-card-icon analyzer">
            <FileText size={22} />
          </div>
          <div className="hub-card-body">
            <h3>Analyze Agreement</h3>
            <p>Upload PDF/DOCX and detect important clauses and risks.</p>
          </div>
          <span className="hub-card-cta">
            Open Analyzer <ArrowRight size={15} />
          </span>
        </button>

        <button
          type="button"
          className={`customer-hub-card buy ${activeSection === "buy" ? "active" : ""}`}
          onClick={() => setActiveSection("buy")}
        >
          <div className="hub-card-icon buy">
            <Tag size={22} />
          </div>
          <div className="hub-card-body">
            <h3>Buy a Property</h3>
            <p>Explore properties available for purchase ({saleCount} available).</p>
          </div>
          <span className="hub-card-cta">
            Explore Purchase <ArrowRight size={15} />
          </span>
        </button>

        <button
          type="button"
          className={`customer-hub-card rent ${activeSection === "rent" ? "active" : ""}`}
          onClick={() => setActiveSection("rent")}
        >
          <div className="hub-card-icon rent">
            <Key size={22} />
          </div>
          <div className="hub-card-body">
            <h3>Rent a Property</h3>
            <p>Search available rental properties ({rentCount} available).</p>
          </div>
          <span className="hub-card-cta">
            Search Rentals <ArrowRight size={15} />
          </span>
        </button>

        <button
          type="button"
          className={`customer-hub-card account ${activeSection === "account" ? "active" : ""}`}
          onClick={() => {
            if (!currentUser && onRequireLogin) {
              onRequireLogin();
            } else {
              setActiveSection("account");
            }
          }}
        >
          <div className="hub-card-icon account">
            <User size={22} />
          </div>
          <div className="hub-card-body">
            <h3>My Account</h3>
            <p>Manage profile, saved properties and agreements.</p>
          </div>
          <span className="hub-card-cta">
            {currentUser
              ? `${savedProperties.length} Saved • ${savedAgreements.length} Docs`
              : "User Login Required"}
            <ArrowRight size={15} />
          </span>
        </button>
      </section>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="toast-success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="error-box" role="alert">
          <AlertCircle size={18} />
          <div>
            <b>Action Notice:</b>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* SECTION: MY ACCOUNT */}
      {activeSection === "account" ? (
        <section className="my-account-section">
          <div className="account-header-bar">
            <div>
              <span className="section-label">MY ACCOUNT</span>
              <h2>Profile, Saved Properties & Agreements</h2>
            </div>
            <div className="account-subtabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={accountTab === "agreements"}
                className={`filter-chip ${accountTab === "agreements" ? "active" : ""}`}
                onClick={() => setAccountTab("agreements")}
              >
                <FileText size={14} /> Saved Agreements ({savedAgreements.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={accountTab === "saved"}
                className={`filter-chip ${accountTab === "saved" ? "active" : ""}`}
                onClick={() => setAccountTab("saved")}
              >
                <Bookmark size={14} /> Saved Properties ({savedProperties.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={accountTab === "listings"}
                className={`filter-chip ${accountTab === "listings" ? "active" : ""}`}
                onClick={() => setAccountTab("listings")}
              >
                <Building size={14} /> My Listings ({myListings.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={accountTab === "profile"}
                className={`filter-chip ${accountTab === "profile" ? "active" : ""}`}
                onClick={() => setAccountTab("profile")}
              >
                <User size={14} /> Profile Settings
              </button>
            </div>
          </div>

          {/* Account Sub-tab: Saved Agreements */}
          {accountTab === "agreements" && (
            <div className="account-panel">
              <div className="account-panel-head">
                <div>
                  <h3>Analyzed Rental Agreements</h3>
                  <p>Agreements you analyzed while signed in (or saved after login) appear here for quick review.</p>
                </div>
                <button
                  type="button"
                  className="primary-btn compact"
                  onClick={() => onAnalyzeAgreement("")}
                >
                  <Plus size={15} /> Analyze New Agreement
                </button>
              </div>

              {accountLoading ? (
                <div className="loading-state">
                  <RefreshCw size={28} className="spin-icon" />
                  <p>Loading your saved agreements...</p>
                </div>
              ) : savedAgreements.length === 0 ? (
                <div className="empty-state">
                  <FileText size={44} />
                  <h3>No saved agreements yet</h3>
                  <p>Upload any PDF or DOCX rental agreement to automatically detect clauses, risks, and fairness score.</p>
                  <button
                    type="button"
                    className="primary-btn compact"
                    onClick={() => onAnalyzeAgreement("")}
                  >
                    <Sparkles size={15} /> Analyze an Agreement
                  </button>
                </div>
              ) : (
                <div className="saved-agreements-grid">
                  {savedAgreements.map((agr) => (
                    <div key={agr.id} className="saved-agreement-card">
                      <div className="saved-agr-top">
                        <div className="saved-agr-icon">
                          <FileText size={20} />
                        </div>
                        <div className="saved-agr-title">
                          <strong>{agr.filename}</strong>
                          <small>
                            {agr.location ? `${agr.location} • ` : ""}
                            {agr.created_at ? new Date(agr.created_at.replace(" ", "T")).toLocaleDateString() : "Saved"}
                          </small>
                        </div>
                        <span className="fairness-pill">
                          <Gauge size={13} /> {agr.fairness_score}/100
                        </span>
                      </div>

                      <div className="saved-agr-metrics">
                        <div>
                          <small>Monthly Rent</small>
                          <b>{agr.monthly_rent || "Not Found"}</b>
                        </div>
                        <div>
                          <small>Security Deposit</small>
                          <b>{agr.security_deposit || "Not Found"}</b>
                        </div>
                        <div>
                          <small>Flagged Risks</small>
                          <b>{agr.risk_count || 0} clauses</b>
                        </div>
                      </div>

                      <div className="saved-agr-actions">
                        <button
                          type="button"
                          className="primary-btn compact"
                          onClick={() => onOpenAgreement && onOpenAgreement(agr.analysis)}
                        >
                          <Eye size={14} /> View Full Analysis
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn delete"
                          title="Delete saved agreement"
                          aria-label={`Delete ${agr.filename}`}
                          onClick={() => handleDeleteAgreement(agr)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Account Sub-tab: Saved Properties */}
          {accountTab === "saved" && (
            <div className="account-panel">
              <div className="account-panel-head">
                <div>
                  <h3>Saved Properties</h3>
                  <p>Homes you bookmarked while exploring Buy a Property or Rent a Property.</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => setActiveSection("buy")}
                  >
                    Browse Buy
                  </button>
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => setActiveSection("rent")}
                  >
                    Browse Rent
                  </button>
                </div>
              </div>

              {savedProperties.length === 0 ? (
                <div className="empty-state">
                  <Bookmark size={44} />
                  <h3>No saved properties yet</h3>
                  <p>Click the bookmark icon on any property under Buy or Rent to save it here.</p>
                </div>
              ) : (
                <div className="properties-grid">
                  {savedProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isSaved={true}
                      onToggleSave={() => handleToggleSave(property.id)}
                      onView={() => setSelectedProperty(property)}
                      canManage={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Account Sub-tab: My Property Listings */}
          {accountTab === "listings" && (
            <div className="account-panel">
              <div className="account-panel-head">
                <div>
                  <h3>My Property Listings</h3>
                  <p>Properties you have listed for Rent or Sale on RentWise.</p>
                </div>
                <button
                  type="button"
                  className="primary-btn compact"
                  onClick={() => {
                    setAddDefaultListingType("rent");
                    setShowAddModal(true);
                  }}
                >
                  <Plus size={15} /> Add New Property Listing
                </button>
              </div>

              {myListings.length === 0 ? (
                <div className="empty-state">
                  <Building size={44} />
                  <h3>You haven't listed a property yet</h3>
                  <p>Own a property to rent out or sell? Publish a listing in under a minute.</p>
                  <button
                    type="button"
                    className="primary-btn compact"
                    onClick={() => {
                      setAddDefaultListingType("rent");
                      setShowAddModal(true);
                    }}
                  >
                    <Plus size={15} /> List a Property
                  </button>
                </div>
              ) : (
                <div className="properties-grid">
                  {myListings.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isSaved={savedIds.includes(property.id)}
                      onToggleSave={() => handleToggleSave(property.id)}
                      onView={() => setSelectedProperty(property)}
                      onToggleStatus={() => handleToggleStatus(property)}
                      onDelete={() => handleDelete(property)}
                      canManage={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Account Sub-tab: Profile Settings */}
          {accountTab === "profile" && (
            <div className="account-panel profile-panel">
              <div className="account-panel-head">
                <div>
                  <h3>Profile Settings</h3>
                  <p>Keep your contact details up to date for property inquiries and listings.</p>
                </div>
                <span className="auth-badge">
                  <ShieldCheck size={14} /> Customer / General User
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label htmlFor="profile-name">Full Name *</label>
                    <input
                      id="profile-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label htmlFor="profile-phone">Phone Number</label>
                    <input
                      id="profile-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="profile-email">Email Address</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={currentUser?.email || ""}
                    disabled
                  />
                </div>

                <button type="submit" className="primary-btn compact" disabled={profileSaving}>
                  <Edit3 size={15} /> {profileSaving ? "Saving Profile..." : "Save Profile Changes"}
                </button>
              </form>
            </div>
          )}
        </section>
      ) : (
        /* SECTIONS: OVERVIEW / BUY A PROPERTY / RENT A PROPERTY */
        <>
          <div className="section-banner-row">
            <div>
              <span className="section-label">
                {activeSection === "buy"
                  ? "BUY A PROPERTY"
                  : activeSection === "rent"
                  ? "RENT A PROPERTY"
                  : "EXPLORE PROPERTIES"}
              </span>
              <h2>
                {activeSection === "buy"
                  ? "Properties Available for Purchase"
                  : activeSection === "rent"
                  ? "Available Rental Properties"
                  : "Browse Properties to Buy or Rent"}
              </h2>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {activeSection !== "overview" && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => setActiveSection("overview")}
                >
                  Show All ({properties.length})
                </button>
              )}
              <button
                type="button"
                className="primary-btn compact"
                onClick={() => {
                  if (!currentUser && onRequireLogin) {
                    onRequireLogin();
                  } else {
                    setAddDefaultListingType(activeSection === "buy" ? "sale" : "rent");
                    setShowAddModal(true);
                  }
                }}
              >
                <Plus size={16} /> List a Property
              </button>
            </div>
          </div>

          {/* Control Bar: Filters & Search */}
          <div className="controls-bar">
            <div className="filter-group">
              <button
                type="button"
                className={`filter-chip ${activeSection === "overview" ? "active" : ""}`}
                onClick={() => setActiveSection("overview")}
              >
                All ({properties.length})
              </button>
              <button
                type="button"
                className={`filter-chip ${activeSection === "buy" ? "active" : ""}`}
                onClick={() => setActiveSection("buy")}
              >
                Buy ({properties.filter((p) => p.listing_type === "sale").length})
              </button>
              <button
                type="button"
                className={`filter-chip ${activeSection === "rent" ? "active" : ""}`}
                onClick={() => setActiveSection("rent")}
              >
                Rent ({properties.filter((p) => p.listing_type === "rent").length})
              </button>
            </div>

            <div className="search-group">
              <div className="search-input-wrap">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Search by title, locality, city, or BHK..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search properties"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                className="city-select"
                value={bhkFilter}
                onChange={(e) => setBhkFilter(e.target.value)}
                aria-label="Filter by BHK"
              >
                <option value="all">All BHK</option>
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
              </select>

              <select
                className="city-select"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                aria-label="Filter by city"
              >
                <option value="all">All Cities</option>
                <option value="Pune">Pune</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>
          </div>

          {/* Property Cards Grid */}
          {loading ? (
            <div className="loading-state">
              <RefreshCw size={32} className="spin-icon" />
              <p>Loading properties...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="empty-state">
              <Building size={48} />
              <h3>No matching properties found</h3>
              <p>Try clearing your filters or switching between Buy and Rent.</p>
              <button
                type="button"
                className="primary-btn compact"
                onClick={() => {
                  setCityFilter("all");
                  setBhkFilter("all");
                  setSearchTerm("");
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="properties-grid">
              {filteredProperties.map((property) => {
                const isOwner =
                  currentUser &&
                  ((property.owner_email &&
                    currentUser.email &&
                    property.owner_email.toLowerCase() === currentUser.email.toLowerCase()) ||
                    (property.owner_name &&
                      currentUser.name &&
                      property.owner_name.toLowerCase() === currentUser.name.toLowerCase()));

                return (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isSaved={savedIds.includes(property.id)}
                    onToggleSave={() => handleToggleSave(property.id)}
                    onView={() => setSelectedProperty(property)}
                    onToggleStatus={() => handleToggleStatus(property)}
                    onDelete={() => handleDelete(property)}
                    canManage={Boolean(isOwner)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <AddPropertyModal
          onClose={() => setShowAddModal(false)}
          currentUser={currentUser}
          defaultListingType={addDefaultListingType}
          onSuccess={(newProp) => {
            setShowAddModal(false);
            setProperties((prev) => [newProp, ...prev]);
            showToast(`Successfully listed "${newProp.title}"!`);
          }}
        />
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onAnalyzeAgreement={onAnalyzeAgreement}
          isSaved={savedIds.includes(selectedProperty.id)}
          onToggleSave={handleToggleSave}
        />
      )}
    </div>
  );
}

function PropertyCard({
  property,
  isSaved,
  onToggleSave,
  onView,
  onToggleStatus,
  onDelete,
  canManage,
}) {
  const isRent = property.listing_type === "rent";
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];

  return (
    <div className={`property-card status-${property.status}`}>
      <div className="card-media">
        <img
          src={property.image_url || SAMPLE_IMAGES[0]}
          alt={property.title}
          className="card-thumb"
        />
        <div className="card-overlay-top">
          <span className={`badge-pill ${isRent ? "rent-pill" : "sale-pill"}`}>
            {isRent ? "FOR RENT" : "FOR SALE"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className={`badge-pill status-${property.status}`}>
              {property.status.toUpperCase()}
            </span>
            <button
              type="button"
              className={`bookmark-overlay-btn ${isSaved ? "saved" : ""}`}
              title={isSaved ? "Remove from Saved Properties" : "Save Property"}
              aria-label={isSaved ? "Remove from Saved Properties" : "Save Property"}
              onClick={onToggleSave}
            >
              <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        <div className="card-overlay-bottom">
          <strong className="card-price">
            {formatPrice(property.price, property.listing_type)}
          </strong>
          {isRent && property.deposit > 0 && (
            <span className="card-deposit">
              Deposit: ₹{Number(property.deposit).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <span className="bhk-badge">{property.bhk || "2 BHK"}</span>
          <span className="type-badge">{property.property_type || "Apartment"}</span>
          <span className="furnish-badge">{property.furnishing || "Semi"}</span>
        </div>

        <h3 className="card-title" title={property.title}>
          {property.title}
        </h3>

        <div className="card-location">
          <MapPin size={15} />
          <span>
            {property.locality}, {property.city}
          </span>
        </div>

        <div className="card-specs">
          <div className="spec-unit">
            <Bed size={14} />
            <span>{property.bhk}</span>
          </div>
          <div className="spec-unit">
            <Bath size={14} />
            <span>{property.bathrooms || 1} Bath</span>
          </div>
          {property.area_sqft > 0 && (
            <div className="spec-unit">
              <Layers size={14} />
              <span>{property.area_sqft} sq.ft</span>
            </div>
          )}
        </div>

        {amenities.length > 0 && (
          <div className="card-amenities">
            {amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="mini-amenity-tag">
                {a}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="mini-amenity-more">+{amenities.length - 3}</span>
            )}
          </div>
        )}

        <div className="card-footer">
          <div className="owner-mini">
            <small>Owner:</small>
            <b>{property.owner_name}</b>
          </div>
          <div className="card-actions">
            <button
              type="button"
              className="action-icon-btn view"
              title="View Full Details"
              onClick={onView}
            >
              <Eye size={16} />
            </button>
            {canManage && onToggleStatus && (
              <button
                type="button"
                className={`action-icon-btn status-btn ${property.status}`}
                title={
                  property.status === "available"
                    ? `Mark as ${isRent ? "Rented" : "Sold"}`
                    : "Mark as Available"
                }
                onClick={onToggleStatus}
              >
                <CheckCircle2 size={16} />
              </button>
            )}
            {canManage && onDelete && (
              <button
                type="button"
                className="action-icon-btn delete"
                title="Delete Property"
                onClick={onDelete}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddPropertyModal({ onClose, onSuccess, currentUser, defaultListingType = "rent" }) {
  const formId = useId();
  const [formData, setFormData] = useState({
    title: "",
    listing_type: defaultListingType,
    property_type: "Apartment",
    city: "Pune",
    locality: "",
    address: "",
    pincode: "",
    price: "",
    deposit: "",
    maintenance: "",
    bhk: "2 BHK",
    bathrooms: "2",
    balconies: "1",
    area_sqft: "",
    furnishing: "Semi Furnished",
    floor: "",
    parking: "Covered 4-wheeler",
    available_from: "Immediate",
    preferred_tenant: "Any",
    amenities: ["Lift", "Power Backup", "24x7 Security"],
    description: "",
    owner_name: currentUser?.name || "",
    owner_phone: currentUser?.phone || "",
    owner_email: currentUser?.email || "",
    image_url: SAMPLE_IMAGES[0]
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAmenity(amenity) {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      const updated = exists
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: updated };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Please enter a property title.");
      return;
    }
    if (!formData.city.trim() || !formData.locality.trim()) {
      setError("Please specify City and Locality.");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError("Please enter a valid price / rent.");
      return;
    }
    if (!formData.owner_name.trim() || !formData.owner_phone.trim()) {
      setError("Please provide Owner Name and Contact Phone.");
      return;
    }

    setBusy(true);
    try {
      const created = await createProperty({
        ...formData,
        price: Number(formData.price),
        deposit: Number(formData.deposit) || 0,
        maintenance: Number(formData.maintenance) || 0,
        bathrooms: Number(formData.bathrooms) || 1,
        balconies: Number(formData.balconies) || 0,
        area_sqft: Number(formData.area_sqft) || 0
      });
      onSuccess(created);
    } catch (err) {
      setError(err.message || "Failed to add property.");
    } finally {
      setBusy(false);
    }
  }

  const isRent = formData.listing_type === "rent";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container add-property-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Add New Property Listing</h2>
            <p>Enter complete property details for potential buyers, tenants, and brokers.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-box modal-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="property-form">
          <div className="form-section">
            <div className="form-section-title">
              <span>1</span> Listing Intent & Property Type
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Listing Purpose *</label>
                <div className="pill-radio-group">
                  <button
                    type="button"
                    className={`pill-radio ${isRent ? "active rent" : ""}`}
                    onClick={() => handleChange("listing_type", "rent")}
                  >
                    <Key size={15} /> For Rent / Lease
                  </button>
                  <button
                    type="button"
                    className={`pill-radio ${!isRent ? "active sale" : ""}`}
                    onClick={() => handleChange("listing_type", "sale")}
                  >
                    <Tag size={15} /> For Sale / Purchase
                  </button>
                </div>
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-type`}>Property Type *</label>
                <select
                  id={`${formId}-type`}
                  value={formData.property_type}
                  onChange={(e) => handleChange("property_type", e.target.value)}
                >
                  <option value="Apartment">Apartment / High-Rise Flat</option>
                  <option value="Villa / House">Independent Villa / House</option>
                  <option value="Studio / 1RK">Studio Apartment / 1RK</option>
                  <option value="Penthouse">Penthouse / Duplex</option>
                  <option value="Commercial">Commercial Office / Shop</option>
                  <option value="Plot">Residential Plot / Land</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor={`${formId}-title`}>Property Title *</label>
              <input
                id={`${formId}-title`}
                type="text"
                placeholder="e.g. Spacious 3 BHK Luxury Apartment with Balcony"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">
              <span>2</span> Location & Address
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor={`${formId}-city`}>City *</label>
                <select
                  id={`${formId}-city`}
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                >
                  <option value="Pune">Pune</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-locality`}>Locality / Area / Sector *</label>
                <input
                  id={`${formId}-locality`}
                  type="text"
                  placeholder="e.g. Koregaon Park or Wakad"
                  value={formData.locality}
                  onChange={(e) => handleChange("locality", e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-pincode`}>Pincode</label>
                <input
                  id={`${formId}-pincode`}
                  type="text"
                  placeholder="e.g. 411001"
                  value={formData.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor={`${formId}-address`}>Full Address & Landmark</label>
              <input
                id={`${formId}-address`}
                type="text"
                placeholder="e.g. Flat 902, Tower B, Silver Woods, Lane 5, near Metro Station"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">
              <span>3</span> Pricing & Financials
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor={`${formId}-price`}>
                  {isRent ? "Monthly Rent (₹) *" : "Total Selling Price (₹) *"}
                </label>
                <input
                  id={`${formId}-price`}
                  type="number"
                  placeholder={isRent ? "e.g. 35000" : "e.g. 15000000"}
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  required
                />
              </div>

              {isRent && (
                <div className="form-group flex-1">
                  <label htmlFor={`${formId}-deposit`}>Security Deposit (₹)</label>
                  <input
                    id={`${formId}-deposit`}
                    type="number"
                    placeholder="e.g. 80000"
                    value={formData.deposit}
                    onChange={(e) => handleChange("deposit", e.target.value)}
                  />
                </div>
              )}

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-maintenance`}>Maintenance Charge (₹/mo)</label>
                <input
                  id={`${formId}-maintenance`}
                  type="number"
                  placeholder="e.g. 2500"
                  value={formData.maintenance}
                  onChange={(e) => handleChange("maintenance", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">
              <span>4</span> Property Specifications
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor={`${formId}-bhk`}>Configuration (BHK)</label>
                <select
                  id={`${formId}-bhk`}
                  value={formData.bhk}
                  onChange={(e) => handleChange("bhk", e.target.value)}
                >
                  <option value="1 RK">1 RK</option>
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="5+ BHK">5+ BHK</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-bath`}>Bathrooms</label>
                <input
                  id={`${formId}-bath`}
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange("bathrooms", e.target.value)}
                  min="1"
                  max="10"
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-balc`}>Balconies</label>
                <input
                  id={`${formId}-balc`}
                  type="number"
                  value={formData.balconies}
                  onChange={(e) => handleChange("balconies", e.target.value)}
                  min="0"
                  max="10"
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-area`}>Super Area (sq. ft)</label>
                <input
                  id={`${formId}-area`}
                  type="number"
                  placeholder="e.g. 1250"
                  value={formData.area_sqft}
                  onChange={(e) => handleChange("area_sqft", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor={`${formId}-furnish`}>Furnishing Status</label>
                <select
                  id={`${formId}-furnish`}
                  value={formData.furnishing}
                  onChange={(e) => handleChange("furnishing", e.target.value)}
                >
                  <option value="Fully Furnished">Fully Furnished</option>
                  <option value="Semi Furnished">Semi Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-floor`}>Floor Position</label>
                <input
                  id={`${formId}-floor`}
                  type="text"
                  placeholder="e.g. 4th of 12 Floors"
                  value={formData.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-parking`}>Parking Facility</label>
                <select
                  id={`${formId}-parking`}
                  value={formData.parking}
                  onChange={(e) => handleChange("parking", e.target.value)}
                >
                  <option value="Covered 4-wheeler">Covered 4-wheeler</option>
                  <option value="Covered 4-wheeler + 2-wheeler">Covered 4W + 2W</option>
                  <option value="Open 4-wheeler">Open Parking</option>
                  <option value="2-wheeler Only">2-wheeler Only</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-avail`}>Available From</label>
                <input
                  id={`${formId}-avail`}
                  type="text"
                  placeholder="e.g. Immediate or 1st Next Month"
                  value={formData.available_from}
                  onChange={(e) => handleChange("available_from", e.target.value)}
                />
              </div>
            </div>

            {isRent && (
              <div className="form-group">
                <label htmlFor={`${formId}-tenant`}>Preferred Tenants</label>
                <select
                  id={`${formId}-tenant`}
                  value={formData.preferred_tenant}
                  onChange={(e) => handleChange("preferred_tenant", e.target.value)}
                >
                  <option value="Any">Any (Family, Working Professionals, or Bachelors)</option>
                  <option value="Family Only">Family Only</option>
                  <option value="Working Professionals Only">Working Professionals Only</option>
                  <option value="Bachelors Only">Bachelors Only</option>
                  <option value="Company Lease">Company Lease</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Amenities (Check all that apply)</label>
              <div className="amenity-checkbox-grid">
                {AMENITY_OPTIONS.map((amenity) => {
                  const checked = formData.amenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      className={`amenity-toggle-btn ${checked ? "selected" : ""}`}
                      onClick={() => toggleAmenity(amenity)}
                    >
                      <span className="check-box">{checked && <Check size={12} />}</span>
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor={`${formId}-desc`}>Detailed Description</label>
              <textarea
                id={`${formId}-desc`}
                rows={3}
                placeholder="Describe key highlights, neighborhood vibe, nearby transit, sunlight, water supply, and society rules..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">
              <span>5</span> Owner Contact & Showcase Image
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor={`${formId}-oname`}>Owner / Lister Name *</label>
                <input
                  id={`${formId}-oname`}
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={formData.owner_name}
                  onChange={(e) => handleChange("owner_name", e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-ophone`}>Contact Phone Number *</label>
                <input
                  id={`${formId}-ophone`}
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.owner_phone}
                  onChange={(e) => handleChange("owner_phone", e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor={`${formId}-oemail`}>Email Address</label>
                <input
                  id={`${formId}-oemail`}
                  type="email"
                  placeholder="e.g. priya@example.com"
                  value={formData.owner_email}
                  onChange={(e) => handleChange("owner_email", e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor={`${formId}-img`}>Property Photo URL</label>
              <input
                id={`${formId}-img`}
                type="url"
                placeholder="Image URL or choose a preset below"
                value={formData.image_url}
                onChange={(e) => handleChange("image_url", e.target.value)}
              />
              <div className="preset-images-strip">
                <small>Quick select architecture presets:</small>
                <div className="preset-thumbs">
                  {SAMPLE_IMAGES.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Preset"
                      className={`preset-thumb ${formData.image_url === img ? "active" : ""}`}
                      onClick={() => handleChange("image_url", img)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions-bar">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={busy}>
              {busy ? "Saving Listing..." : "Publish Property Listing"} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
