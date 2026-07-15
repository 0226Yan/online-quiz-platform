import React from 'react';

// Small theme-aware loading indicator. Pass `label` to add an accessible
// caption underneath; pass `inline` to render inline (e.g. inside buttons).
const Spinner = ({ size = 32, label, inline = false }) => {
  const ring = (
    <span
      className="spinner-ring"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 10)) }}
      role="status"
      aria-label={label || 'Loading'}
    />
  );

  if (inline) return ring;

  return (
    <div className="spinner-wrap">
      {ring}
      {label && <p className="text-muted spinner-label">{label}</p>}
    </div>
  );
};

export default Spinner;
