import React from "react";

export default function FormSection({ title, children, accentColor = "#004b49" }) {
  return (
    <div className="pn-section" style={{ borderLeftColor: accentColor }}>
      {title && <h4 className="pn-section__title">{title}</h4>}
      {children}
    </div>
  );
}
