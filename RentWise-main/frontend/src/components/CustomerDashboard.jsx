import React, { useState, useEffect } from "react";
import {
  Plus, Search, Filter, Home, Bed, Bath, Layers, MapPin, Phone,
  Trash2, Eye, CheckCircle2, AlertCircle, Sparkles, Building, Key,
  Tag, RefreshCw, X, Check, ArrowRight
} from "lucide-react";
import { getProperties, createProperty, updateProperty, deleteProperty } from "../services/api";
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

export default function CustomerDashboard({ onAnalyzeAgreement }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [listingFilter, setListingFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Load properties
  async function loadData() {
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

  useEffect(() => {
    loadData();
  }, []);

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    if (listingFilter !== "all" && p.listing_type !== listingFilter) return false;
    if (cityFilter !== "all" && p.city.toLowerCase() !== cityFilter.toLowerCase()) return false;
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
  const totalCount = properties.length;
  const rentCount = properties.filter((p) => p.listing_type === "rent").length;
  const saleCount = properties.filter((p) => p.listing_type === "sale").length;
  const availableCount = properties.filter((p) => p.status === "available").length;

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
      setSuccessMsg(`Status updated for "${property.title}" to ${nextStatus.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(""), 3500);
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
      setSuccessMsg(`Property "${property.title}" was removed.`);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message || "Failed to delete property.");
    }
  }

  return (
    <div className="dashboard-page customer-dashboard">
      {/* Top Banner / Hero */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="eyebrow">
            <Building size={14} /> Property Owner & Lister Portal
          </div>
          <h1>Manage Your Property Listings</h1>
          <p>
            Add complete property details for <b>Rent</b> or <b>Sale</b>, track availability, and connect directly with verified tenants, buyers, and brokers.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn pulse-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add New Property Listing
            </button>
            <button className="secondary-btn" onClick={loadData}>
              <RefreshCw size={15} /> Refresh Listings
            </button>
          </div>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="stats-ribbon">
        <div className="stat-card">
          <div className="stat-icon total">
            <Building size={20} />
          </div>
          <div>
            <span className="stat-label">TOTAL PROPERTIES</span>
            <strong className="stat-val">{totalCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rent">
            <Key size={20} />
          </div>
          <div>
            <span className="stat-label">FOR RENT</span>
            <strong className="stat-val">{rentCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sale">
            <Tag size={20} />
          </div>
          <div>
            <span className="stat-label">FOR SALE</span>
            <strong className="stat-val">{saleCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="stat-label">ACTIVE & AVAILABLE</span>
            <strong className="stat-val">{availableCount}</strong>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="error-box">
          <AlertCircle size={18} />
          <div>
            <b>Error loading listings:</b>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="controls-bar">
        <div className="filter-group">
          <button
            className={`filter-chip ${listingFilter === "all" ? "active" : ""}`}
            onClick={() => setListingFilter("all")}
          >
            All Listings ({totalCount})
          </button>
          <button
            className={`filter-chip ${listingFilter === "rent" ? "active" : ""}`}
            onClick={() => setListingFilter("rent")}
          >
            For Rent ({rentCount})
          </button>
          <button
            className={`filter-chip ${listingFilter === "sale" ? "active" : ""}`}
            onClick={() => setListingFilter("sale")}
          >
            For Sale ({saleCount})
          </button>
        </div>

        <div className="search-group">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by title, locality, city, or BHK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="city-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
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
          <h3>No properties found</h3>
          <p>Try adjusting your search criteria or add your first property listing above.</p>
          <button className="primary-btn compact" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Property Now
          </button>
        </div>
      ) : (
        <div className="properties-grid">
          {filteredProperties.map((property) => {
            const isRent = property.listing_type === "rent";
            const amenities = Array.isArray(property.amenities) ? property.amenities : [];

            return (
              <div key={property.id} className={`property-card status-${property.status}`}>
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
                    <span className={`badge-pill status-${property.status}`}>
                      {property.status.toUpperCase()}
                    </span>
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
                        className="action-icon-btn view"
                        title="View Full Details"
                        onClick={() => setSelectedProperty(property)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className={`action-icon-btn status-btn ${property.status}`}
                        title={
                          property.status === "available"
                            ? `Mark as ${isRent ? "Rented" : "Sold"}`
                            : "Mark as Available"
                        }
                        onClick={() => handleToggleStatus(property)}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        className="action-icon-btn delete"
                        title="Delete Property"
                        onClick={() => handleDelete(property)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <AddPropertyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newProp) => {
            setShowAddModal(false);
            setProperties((prev) => [newProp, ...prev]);
            setSuccessMsg(`Successfully listed "${newProp.title}"!`);
            setTimeout(() => setSuccessMsg(""), 4000);
          }}
        />
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

function AddPropertyModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    listing_type: "rent",
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
    owner_name: "",
    owner_phone: "",
    owner_email: "",
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
          <button className="modal-close-btn" onClick={onClose}>
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
          {/* Section 1: Intent & Basic */}
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
                <label>Property Type *</label>
                <select
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
              <label>Property Title *</label>
              <input
                type="text"
                placeholder="e.g. Spacious 3 BHK Luxury Apartment with Balcony"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="form-section">
            <div className="form-section-title">
              <span>2</span> Location & Address
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>City *</label>
                <select
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
                <label>Locality / Area / Sector *</label>
                <input
                  type="text"
                  placeholder="e.g. Koregaon Park or Wakad"
                  value={formData.locality}
                  onChange={(e) => handleChange("locality", e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label>Pincode</label>
                <input
                  type="text"
                  placeholder="e.g. 411001"
                  value={formData.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Full Address & Landmark</label>
              <input
                type="text"
                placeholder="e.g. Flat 902, Tower B, Silver Woods, Lane 5, near Metro Station"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Financials */}
          <div className="form-section">
            <div className="form-section-title">
              <span>3</span> Pricing & Financials
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>{isRent ? "Monthly Rent (₹) *" : "Total Selling Price (₹) *"}</label>
                <input
                  type="number"
                  placeholder={isRent ? "e.g. 35000" : "e.g. 15000000"}
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  required
                />
              </div>

              {isRent && (
                <div className="form-group flex-1">
                  <label>Security Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 80000"
                    value={formData.deposit}
                    onChange={(e) => handleChange("deposit", e.target.value)}
                  />
                </div>
              )}

              <div className="form-group flex-1">
                <label>Maintenance Charge (₹/mo)</label>
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  value={formData.maintenance}
                  onChange={(e) => handleChange("maintenance", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Specifications & Furnishing */}
          <div className="form-section">
            <div className="form-section-title">
              <span>4</span> Property Specifications
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Configuration (BHK)</label>
                <select
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
                <label>Bathrooms</label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange("bathrooms", e.target.value)}
                  min="1"
                  max="10"
                />
              </div>

              <div className="form-group flex-1">
                <label>Balconies</label>
                <input
                  type="number"
                  value={formData.balconies}
                  onChange={(e) => handleChange("balconies", e.target.value)}
                  min="0"
                  max="10"
                />
              </div>

              <div className="form-group flex-1">
                <label>Super Area (sq. ft)</label>
                <input
                  type="number"
                  placeholder="e.g. 1250"
                  value={formData.area_sqft}
                  onChange={(e) => handleChange("area_sqft", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Furnishing Status</label>
                <select
                  value={formData.furnishing}
                  onChange={(e) => handleChange("furnishing", e.target.value)}
                >
                  <option value="Fully Furnished">Fully Furnished</option>
                  <option value="Semi Furnished">Semi Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Floor Position</label>
                <input
                  type="text"
                  placeholder="e.g. 4th of 12 Floors"
                  value={formData.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
                />
              </div>

              <div className="form-group flex-1">
                <label>Parking Facility</label>
                <select
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
                <label>Available From</label>
                <input
                  type="text"
                  placeholder="e.g. Immediate or 1st Next Month"
                  value={formData.available_from}
                  onChange={(e) => handleChange("available_from", e.target.value)}
                />
              </div>
            </div>

            {isRent && (
              <div className="form-group">
                <label>Preferred Tenants</label>
                <select
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
              <label>Detailed Description</label>
              <textarea
                rows={3}
                placeholder="Describe key highlights, neighborhood vibe, nearby transit, sunlight, water supply, and society rules..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </div>

          {/* Section 5: Owner Contact & Photos */}
          <div className="form-section">
            <div className="form-section-title">
              <span>5</span> Owner Contact & Showcase Image
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Owner / Lister Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={formData.owner_name}
                  onChange={(e) => handleChange("owner_name", e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label>Contact Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.owner_phone}
                  onChange={(e) => handleChange("owner_phone", e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. priya@example.com"
                  value={formData.owner_email}
                  onChange={(e) => handleChange("owner_email", e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Property Photo URL</label>
              <input
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
