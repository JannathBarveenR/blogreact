import React from "react";
import "./AppFooterSpacer.css";

/**
 * AppFooterSpacer — Generates extended scrollable space at the bottom of pages
 * with a soft fading green gradient over white and a subtle "petolife" watermark on the right.
 */
const AppFooterSpacer = () => {
  return (
    <div className="app-footer-spacer">
      <span className="app-footer-spacer__text">petolife</span>
    </div>
  );
};

export default AppFooterSpacer;
