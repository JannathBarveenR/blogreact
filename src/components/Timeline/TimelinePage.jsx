import React from "react";
import "./TimelinePage.css";
import TopNav from "../common/TopNav/TopNav";

export default function TimelinePage() {
  return (
    <div className="timeline-page">
      <TopNav />
      <div className="timeline-body">
        <div className="timeline-card">
          <div className="timeline-icon-wrap">
            <div className="timeline-pulse-ring"></div>
<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#004b49" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
  {/* three chevron/arrow segments in a row */}
  <path
    className="timeline-icon-path"
    d="M2,8 L6,8 L8,12 L6,16 L2,16 L4,12 Z
       M9,8 L13,8 L15,12 L13,16 L9,16 L11,12 Z
       M16,8 L20,8 L22,12 L20,16 L16,16 L18,12 Z"
  />

  {/* stem + node above chevron 1 (top-left) */}
  <line className="timeline-icon-dot dot-1" x1="4" y1="8" x2="4" y2="3.6" />
  <circle className="timeline-icon-dot dot-1" cx="4" cy="3" r="1.3" fill="#ffffff" stroke="#004b49" />

  {/* stem + node above chevron 3 (top-right) */}
  <line className="timeline-icon-dot dot-2" x1="18" y1="8" x2="18" y2="3.6" />
  <circle className="timeline-icon-dot dot-2" cx="18" cy="3" r="1.3" fill="#ffffff" stroke="#004b49" />

  {/* stem + node below chevron 2 (bottom-middle) */}
  <line className="timeline-icon-dot dot-3" x1="12" y1="16" x2="12" y2="20.4" />
  <circle className="timeline-icon-dot dot-3" cx="12" cy="21" r="1.3" fill="#ffffff" stroke="#004b49" />
</svg>
          </div>

          <span className="timeline-badge">✨ Feature Preview</span>

          <h2 className="timeline-title">Pet Life Timeline</h2>
          <h3 className="timeline-status">Coming Soon!</h3>

          <p className="timeline-desc">
            We're building an interactive milestone timeline for your pet! Soon you'll be able to track growth milestones, memory galleries, vaccination histories, and special moments all in one chronological story.
          </p>

          <div className="timeline-features-preview">
            <div className="preview-feature-item" style={{ animationDelay: "0.15s" }}>
              <span className="feat-dot"></span>
              <span>Growth & Weight Milestones</span>
            </div>
            <div className="preview-feature-item" style={{ animationDelay: "0.28s" }}>
              <span className="feat-dot"></span>
              <span>Photo & Memory Gallery</span>
            </div>
            <div className="preview-feature-item" style={{ animationDelay: "0.41s" }}>
              <span className="feat-dot"></span>
              <span>Life Event Highlights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}