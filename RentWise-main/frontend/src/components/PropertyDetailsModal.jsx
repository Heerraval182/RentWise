import React from "react";
import {
  X, MapPin, Home, Bed, Bath, Layers, Car, Calendar,
  ShieldCheck, Phone, Mail, User, Sparkles, Check, FileText, ArrowRight, Bookmark
} from "lucide-react";

export function formatPrice(price, listingType) {
  if (!price && price !== 0) return "Price on Request";
  const num = Number(price);
  if (listingType === "rent") {
    return `₹${num.toLocaleString("en-IN")}/mo`;
  }
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakh`;
  }
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function PropertyDetailsModal({
  property,
  onClose,
  onAnalyzeAgreement,
  isSaved = false,
  onToggleSave,
}) {
  if (!property) return null;

  const isRent = property.listing_type === "rent";
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-badges">
            <span className={`badge-pill ${isRent ? "rent-pill" : "sale-pill"}`}>
              {isRent ? "FOR RENT" : "FOR SALE"}
            </span>
            <span className={`badge-pill status-${property.status || "available"}`}>
              {(property.status || "available").toUpperCase()}
            </span>
            <span className="badge-pill type-pill">{property.property_type || "Apartment"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {onToggleSave && (
              <button
                type="button"
                className={`save-prop-pill-btn ${isSaved ? "saved" : ""}`}
                onClick={() => onToggleSave(property.id)}
              >
                <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? "Saved" : "Save Property"}
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {property.image_url && (
            <div className="modal-image-wrapper">
              <img src={property.image_url} alt={property.title} className="modal-image" />
              <div className="modal-image-overlay">
                <span className="modal-price-tag">{formatPrice(property.price, property.listing_type)}</span>
                {isRent && property.deposit > 0 && (
                  <span className="modal-deposit-tag">Deposit: ₹{Number(property.deposit).toLocaleString("en-IN")}</span>
                )}
              </div>
            </div>
          )}

          <div className="modal-content-grid">
            <div className="modal-main-info">
              <h2 className="modal-title">{property.title}</h2>
              <div className="modal-location">
                <MapPin size={17} />
                <span>
                  {property.locality}, {property.city}
                  {property.pincode ? ` - ${property.pincode}` : ""}
                </span>
              </div>
              {property.address && <p className="modal-address"><b>Full Address:</b> {property.address}</p>}

              <div className="modal-specs-strip">
                <div className="spec-item">
                  <Bed size={18} />
                  <div>
                    <small>Bedrooms</small>
                    <b>{property.bhk || "2 BHK"}</b>
                  </div>
                </div>
                <div className="spec-item">
                  <Bath size={18} />
                  <div>
                    <small>Bathrooms</small>
                    <b>{property.bathrooms || 1}</b>
                  </div>
                </div>
                <div className="spec-item">
                  <Layers size={18} />
                  <div>
                    <small>Super Area</small>
                    <b>{property.area_sqft ? `${property.area_sqft} sq.ft` : "N/A"}</b>
                  </div>
                </div>
                <div className="spec-item">
                  <Home size={18} />
                  <div>
                    <small>Furnishing</small>
                    <b>{property.furnishing || "Semi"}</b>
                  </div>
                </div>
                <div className="spec-item">
                  <Car size={18} />
                  <div>
                    <small>Parking</small>
                    <b>{property.parking || "Covered"}</b>
                  </div>
                </div>
                <div className="spec-item">
                  <Calendar size={18} />
                  <div>
                    <small>Available From</small>
                    <b>{property.available_from || "Immediate"}</b>
                  </div>
                </div>
              </div>

              {property.description && (
                <div className="modal-section">
                  <h3>Property Overview</h3>
                  <p className="modal-description">{property.description}</p>
                </div>
              )}

              {amenities.length > 0 && (
                <div className="modal-section">
                  <h3>Amenities & Features</h3>
                  <div className="modal-amenities-tags">
                    {amenities.map((amenity, idx) => (
                      <span key={idx} className="amenity-chip">
                        <Check size={13} /> {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isRent && property.preferred_tenant && (
                <div className="modal-section info-card-mini">
                  <ShieldCheck size={18} />
                  <div>
                    <b>Preferred Tenant Profile:</b>
                    <span>{property.preferred_tenant}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-sidebar-contact">
              <div className="contact-card">
                <h3>Contact Owner / Lister</h3>
                <div className="owner-profile">
                  <div className="owner-avatar">
                    <User size={24} />
                  </div>
                  <div>
                    <b>{property.owner_name}</b>
                    <small>Property Owner / Lister</small>
                  </div>
                </div>

                <div className="contact-details-list">
                  <a href={`tel:${property.owner_phone}`} className="contact-action-btn phone">
                    <Phone size={16} /> Call: {property.owner_phone}
                  </a>
                  {property.owner_email && (
                    <a href={`mailto:${property.owner_email}`} className="contact-action-btn email">
                      <Mail size={16} /> Email Owner
                    </a>
                  )}
                  <a
                    href={`https://wa.me/${property.owner_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${property.owner_name}, I am interested in your property "${property.title}" listed on RentWise.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="contact-action-btn whatsapp"
                  >
                    💬 Chat on WhatsApp
                  </a>
                </div>

                {onAnalyzeAgreement && (
                  <div className="rentwise-cta-box">
                    <div className="cta-icon">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <b>Have an agreement for this property?</b>
                      <p>Run RentWise AI agreement analyzer to check risks & fairness score.</p>
                      <button
                        className="primary-btn compact full-width"
                        onClick={() => {
                          onClose();
                          onAnalyzeAgreement(property.city);
                        }}
                      >
                        Analyze Agreement <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
