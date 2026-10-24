/* AUTO-GENERATED from app.jsx by build.js — do not edit directly. */
const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;

/* ---------- shared formatting + client-side model (mirrors lib/*) ---------- */
const fmt = (n, d = 0) => n == null || isNaN(n) ? '—' : Number(n).toLocaleString(undefined, {
  maximumFractionDigits: d,
  minimumFractionDigits: d > 0 ? 0 : 0
});
const api = async (url, opts) => {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
  return r.json();
};
const CFG = {
  ICE_CO2_PER_KM: 0.192,
  GRID_CO2_PER_KWH: 0.233,
  ICE_FUEL_PER_KM: 0.071,
  CO2_PER_TREE_YEAR: 21,
  PETROL_CO2_PER_L: 2.31,
  EFF_TARGET: 15,
  EFF_CEIL: 28,
  POINTS_PER_KM: 1,
  ECO_BONUS: 60,
  POINTS_PER_KG: 2,
  CHARGE_BONUS: 25
};
const POWERTRAINS = {
  BEV: {
    label: 'Battery Electric',
    electricShare: 1.0,
    plugIn: true,
    hybridFuelFactor: 0
  },
  PHEV: {
    label: 'Plug-in Hybrid',
    electricShare: 0.62,
    plugIn: true,
    hybridFuelFactor: 0.78
  },
  HEV: {
    label: 'Hybrid',
    electricShare: 0.30,
    plugIn: false,
    hybridFuelFactor: 0.62
  }
};
// Live trip computation for the Simulator Lab — mirrors lib/simulator + lib/co2.
function computeTrip(p, pt = 'BEV') {
  const P = POWERTRAINS[pt] || POWERTRAINS.BEV;
  const {
    distanceKm,
    aggression,
    regen,
    avgSpeedKph,
    batteryFriendlyCharge
  } = p;
  const speedPenalty = Math.max(0, avgSpeedKph - 90) * 0.05;
  const aggrPenalty = aggression * 7;
  const regenSaving = aggrPenalty * regen * 0.6;
  const consumption = Math.max(11, 16 + speedPenalty + aggrPenalty - regenSaving); // full kWh/100km basis
  const energyUsedKwh = consumption / 100 * distanceKm * P.electricShare;
  const baseline = distanceKm * CFG.ICE_CO2_PER_KM;
  const evCo2 = energyUsedKwh * CFG.GRID_CO2_PER_KWH;
  const fuelLitres = distanceKm * (1 - P.electricShare) * CFG.ICE_FUEL_PER_KM * P.hybridFuelFactor;
  const co2SavedKg = Math.max(0, baseline - evCo2 - fuelLitres * CFG.PETROL_CO2_PER_L);
  const fuelSaved = distanceKm * CFG.ICE_FUEL_PER_KM * 1.7 - (energyUsedKwh * 0.28 + fuelLitres * 1.7);
  const effRatio = Math.min(1, Math.max(0, (CFG.EFF_CEIL - consumption) / (CFG.EFF_CEIL - CFG.EFF_TARGET)));
  const harshB = Math.max(0, Math.round(distanceKm / 14 * aggression * (1 - regen * 0.7)));
  const harshA = Math.max(0, Math.round(distanceKm / 12 * aggression));
  let smooth = 30 - harshB * 4 - harshA * 4;
  smooth = Math.min(30, Math.max(0, smooth));
  const ecoScore = Math.round(Math.min(100, effRatio * 70 + smooth));
  const chargeBonus = P.plugIn && batteryFriendlyCharge ? CFG.CHARGE_BONUS : 0;
  const pts = Math.round(distanceKm * CFG.POINTS_PER_KM + ecoScore / 100 * CFG.ECO_BONUS + co2SavedKg * CFG.POINTS_PER_KG + chargeBonus);
  return {
    consumption,
    energyUsedKwh,
    co2SavedKg,
    fuelSaved,
    ecoScore,
    pointsEarned: pts,
    harshB,
    harshA,
    chargeBonus,
    plugIn: P.plugIn
  };
}
function gradeOf(s) {
  return s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 60 ? 'C' : s >= 50 ? 'D' : 'E';
}
function gradeColor(s) {
  return s >= 80 ? '#00a14b' : s >= 60 ? '#00bfa6' : s >= 50 ? '#c47a08' : '#dc4a5c';
}

/* ---------- icon system (line icons, no emoji) ---------- */
function Icon({
  name,
  size = 20,
  className,
  stroke = 1.8
}) {
  const inner = {
    grid: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "3",
      width: "7",
      height: "7",
      rx: "1.5"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "3",
      width: "7",
      height: "7",
      rx: "1.5"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "14",
      width: "7",
      height: "7",
      rx: "1.5"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "14",
      width: "7",
      height: "7",
      rx: "1.5"
    })),
    sliders: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
      x1: "4",
      y1: "8",
      x2: "20",
      y2: "8"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "4",
      y1: "16",
      x2: "20",
      y2: "16"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "8",
      r: "2.6",
      fill: "var(--panel)"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "15",
      cy: "16",
      r: "2.6",
      fill: "var(--panel)"
    })),
    battery: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "2.5",
      y: "7",
      width: "16",
      height: "10",
      rx: "2.2"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "21.5",
      y1: "10.5",
      x2: "21.5",
      y2: "13.5"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "5",
      y: "9.5",
      width: "6.5",
      height: "5",
      rx: "1",
      fill: "currentColor",
      stroke: "none"
    })),
    leaf: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4 20c0-8 6-14 16-14 0 10-6 16-16 14z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M9 15c3-3 5-4 8-5"
    })),
    gift: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "3.5",
      y: "9",
      width: "17",
      height: "11",
      rx: "1.5"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "12",
      y1: "9",
      x2: "12",
      y2: "20"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "3.5",
      y1: "13",
      x2: "20.5",
      y2: "13"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 9C9.5 9 7.5 7.8 7.5 6.3S9 4.5 10 5.3 12 9 12 9zM12 9c2.5 0 4.5-1.2 4.5-2.7S15 4.5 14 5.3 12 9 12 9z"
    })),
    target: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "8.5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "4.6"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "1.2",
      fill: "currentColor",
      stroke: "none"
    })),
    trophy: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M7 4h10v4a5 5 0 01-10 0z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M7 5.5H4.6V7A3.4 3.4 0 008 10.4M17 5.5h2.4V7A3.4 3.4 0 0116 10.4"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "12",
      y1: "13",
      x2: "12",
      y2: "16"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "8.5",
      y1: "20",
      x2: "15.5",
      y2: "20"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "9.5",
      y1: "20",
      x2: "9.5",
      y2: "16.5"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "14.5",
      y1: "20",
      x2: "14.5",
      y2: "16.5"
    })),
    flame: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 3c1.6 3 4.2 4.6 4.2 8.2A4.2 4.2 0 017.8 11C7.8 9.7 8.2 9 8.8 8.2 9 10 11 8.5 12 3z"
    })),
    star: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.6 9.7l5.8-.8z"
    })),
    bolt: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M13 2.5L5 13.5h5l-1 8 9-12h-5z"
    })),
    shield: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 3l7 3v5c0 5-3.4 8-7 9-3.6-1-7-4-7-9V6z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M9 12l2 2 4-4"
    })),
    tree: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 3l5 7.5h-3l4 6H6l4-6H7z"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "12",
      y1: "16.5",
      x2: "12",
      y2: "21"
    })),
    wrench: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "3.2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 3.2v3M12 17.8v3M3.2 12h3M17.8 12h3M5.8 5.8l2.1 2.1M16.1 16.1l2.1 2.1M5.8 18.2l2.1-2.1M16.1 7.9l2.1-2.1"
    })),
    coffee: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4.5 8.5h11.5v5a4 4 0 01-4 4H8.5a4 4 0 01-4-4z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M16 9.5h2.3a2.3 2.3 0 010 4.6H16"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M7.5 3v2M10.5 3v2M13.5 3v2"
    })),
    droplet: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 3.5c3.5 4.5 5.5 7.5 5.5 10.5a5.5 5.5 0 01-11 0c0-3 2-6 5.5-10.5z"
    })),
    plug: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M9 3v4M15 3v4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M6.5 7h11v2.5a5.5 5.5 0 01-11 0z"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "12",
      y1: "15",
      x2: "12",
      y2: "21"
    })),
    globe: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "8.5"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "3.5",
      y1: "12",
      x2: "20.5",
      y2: "12"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"
    })),
    road: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M8.5 4L5 20M15.5 4L19 20M12 5.5v2M12 11v2M12 16.5v2"
    })),
    car: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M3 13l1.8-4.6A2.2 2.2 0 016.9 7h10.2a2.2 2.2 0 012.1 1.4L21 13"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 13h18v4.2H3z"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "7.2",
      cy: "17.4",
      r: "1.5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "16.8",
      cy: "17.4",
      r: "1.5"
    })),
    check: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M5 12.5l4.5 4.5L19 7.5"
    })),
    alert: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 4.5l8.5 15h-17z"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "12",
      y1: "10",
      x2: "12",
      y2: "14"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "16.7",
      r: "0.7",
      fill: "currentColor",
      stroke: "none"
    })),
    bulb: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 17.5h5M10.5 20.5h3"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 3.5a6 6 0 00-3.8 10.6c.7.6 1 1.2 1 2.4h5.6c0-1.2.3-1.8 1-2.4A6 6 0 0012 3.5z"
    })),
    flag: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M6 21V4M6 4.5h11l-2 3.4 2 3.4H6"
    })),
    wallet: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "3.5",
      y: "6.5",
      width: "17",
      height: "12",
      rx: "2.2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M16.5 12.5h1.6"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3.5 10h12.5a1.5 1.5 0 011.5 1.5"
    })),
    gauge: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4.5 17a7.5 7.5 0 0115 0"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "12",
      y1: "17",
      x2: "15.5",
      y2: "11.5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "17",
      r: "1.3",
      fill: "currentColor",
      stroke: "none"
    })),
    trend: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4 7l6 6 3.5-3.5L20 16"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M20 11v5h-5"
    })),
    play: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M7.5 5.5l11 6.5-11 6.5z"
    })),
    refresh: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4.5 12a7.5 7.5 0 0112.7-5.4L20 9M20 4.5V9h-4.5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M19.5 12a7.5 7.5 0 01-12.7 5.4L4 15M4 19.5V15h4.5"
    })),
    arrow: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
      x1: "4",
      y1: "12",
      x2: "18.5",
      y2: "12"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M13.5 7l5 5-5 5"
    }))
  }[name] || null;
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className: 'ic ' + (className || ''),
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, inner);
}
function Pt({
  code,
  small
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: 'ptbadge' + (small ? ' sm' : ''),
    title: (POWERTRAINS[code] || {}).label || code
  }, /*#__PURE__*/React.createElement(Icon, {
    name: code === 'HEV' ? 'car' : 'bolt',
    size: small ? 12 : 13,
    stroke: 2
  }), code);
}

/* ---------- tiny SVG chart primitives ---------- */
function Gauge({
  value,
  max = 100,
  size = 140,
  label,
  color
}) {
  const r = size / 2 - 12,
    c = 2 * Math.PI * r,
    pct = Math.min(1, value / max);
  color = color || '#00a14b';
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "gg",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#00a14b"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#00bfa6"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "#e6ecf3",
    strokeWidth: "11"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color === 'grad' ? 'url(#gg)' : color,
    strokeWidth: "11",
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - pct),
    transform: `rotate(-90 ${size / 2} ${size / 2})`,
    style: {
      transition: 'stroke-dashoffset .6s'
    }
  }), /*#__PURE__*/React.createElement("text", {
    x: "50%",
    y: "47%",
    textAnchor: "middle",
    fontSize: "26",
    fontWeight: "800",
    fill: "#0f1d2e"
  }, fmt(value, value < 10 ? 1 : 0)), /*#__PURE__*/React.createElement("text", {
    x: "50%",
    y: "63%",
    textAnchor: "middle",
    fontSize: "11",
    fill: "#5b6b7d"
  }, label));
}
function AreaChart({
  data,
  height = 120,
  color = '#00a14b'
}) {
  const w = 560;
  const max = Math.max(...data, 1);
  const min = 0;
  if (!data.length) return /*#__PURE__*/React.createElement("div", {
    className: "muted small"
  }, "No data");
  const step = w / (data.length - 1 || 1);
  const pts = data.map((v, i) => [i * step, height - (v - min) / (max - min || 1) * (height - 10) - 5]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L ${w} ${height} L 0 ${height} Z`;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${height}`,
    width: "100%",
    height: height,
    preserveAspectRatio: "none"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "ar",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.32"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: "url(#ar)"
  }), /*#__PURE__*/React.createElement("path", {
    d: path,
    fill: "none",
    stroke: color,
    strokeWidth: "2.5"
  }));
}
function Bars({
  data,
  height = 120,
  color = '#00bfa6'
}) {
  const max = Math.max(...data.map(d => d.v), 1);
  const bw = 100 / data.length;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    width: "100%",
    height: height,
    preserveAspectRatio: "none"
  }, data.map((d, i) => {
    const h = d.v / max * 92;
    return /*#__PURE__*/React.createElement("rect", {
      key: i,
      x: i * bw + bw * 0.18,
      y: 100 - h,
      width: bw * 0.64,
      height: h,
      rx: "1.2",
      fill: color,
      opacity: 0.5 + 0.5 * (d.v / max)
    });
  }));
}

/* ---------- shells ---------- */
function Stat({
  label,
  value,
  unit,
  icon,
  delta
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "card stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "cardicon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 19
  }))), /*#__PURE__*/React.createElement("div", {
    className: "val"
  }, value, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, unit)), delta && /*#__PURE__*/React.createElement("div", {
    className: "delta"
  }, delta));
}
function Progress({
  pct
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bar"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: Math.min(100, Math.max(0, pct)) + '%'
    }
  }));
}
function recIcon(impact) {
  return impact === 'low' ? 'check' : impact === 'high' ? 'alert' : 'bulb';
}

/* ===================== VIEWS ===================== */
function Dashboard({
  me,
  go
}) {
  const trips = me.recentTrips || [];
  const series = useMemo(() => {
    const ordered = [...trips].reverse();
    let acc = 0;
    return ordered.map(t => acc += t.co2SavedKg || 0);
  }, [me]);
  const b = me.battery;
  const pv = me.primaryVehicle || {};
  return /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid g4"
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "CO\u2082 Avoided",
    value: fmt(me.impact.totalCo2SavedKg),
    unit: "kg",
    icon: "leaf",
    delta: `≈ ${fmt(me.impact.treesEquivalent, 1)} trees/yr`
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Eco-Credits",
    value: fmt(me.loyalty.balance),
    unit: "pts",
    icon: "star",
    delta: `${me.loyalty.tier.name} · ${me.loyalty.tier.multiplier}× earning`
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Driving Grade",
    value: me.avgEcoGrade,
    unit: "",
    icon: "flag",
    delta: `${me.avgEcoScore}/100 avg eco score`
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Battery Health",
    value: fmt(b ? b.soh : 0, 1),
    unit: "%",
    icon: "battery",
    delta: `${b ? b.projection.estimatedYearsRemaining : 0} yrs to floor`
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid g3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      gridColumn: 'span 2'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("h3", null, "Cumulative CO\u2082 Saved"), /*#__PURE__*/React.createElement("span", {
    className: "pill good"
  }, fmt(me.impact.fuelLitresAvoided), " L fuel avoided")), /*#__PURE__*/React.createElement(AreaChart, {
    data: series.length ? series : [0, 0]
  }), /*#__PURE__*/React.createElement("div", {
    className: "row between small muted",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, me.tripCount, " trips logged"), /*#__PURE__*/React.createElement("span", null, "$", fmt(me.impact.costSaved), " saved vs petrol"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      alignSelf: 'flex-start'
    }
  }, "Loyalty Tier"), /*#__PURE__*/React.createElement("div", {
    className: "tierbadge",
    style: {
      background: me.loyalty.tier.color,
      marginBottom: 14
    }
  }, me.loyalty.tier.name), me.loyalty.tier.next ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "small muted",
    style: {
      marginBottom: 8
    }
  }, fmt(me.loyalty.tier.pointsToNext), " pts to ", me.loyalty.tier.next), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement(Progress, {
    pct: me.loyalty.tier.progressPct
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "small muted"
  }, "Top tier reached"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      marginTop: 16,
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "b row",
    style: {
      fontSize: 22,
      gap: 6,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flame",
    size: 20,
    className: "accent"
  }), me.loyalty.streak), /*#__PURE__*/React.createElement("div", {
    className: "small muted"
  }, "day streak")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "b",
    style: {
      fontSize: 22
    }
  }, me.loyalty.badges.filter(x => x.earned).length), /*#__PURE__*/React.createElement("div", {
    className: "small muted"
  }, "badges"))))), /*#__PURE__*/React.createElement("div", {
    className: "grid g2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("h3", null, "Recent Trips"), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost small",
    onClick: () => go('lab')
  }, "Drive in Lab")), trips.slice(0, 6).map(t => /*#__PURE__*/React.createElement("div", {
    className: "trip",
    key: t.id
  }, /*#__PURE__*/React.createElement("div", {
    className: "grade",
    style: {
      background: gradeColor(t.ecoScore) + '1f',
      color: gradeColor(t.ecoScore)
    }
  }, gradeOf(t.ecoScore)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "b"
  }, t.profile), /*#__PURE__*/React.createElement("div", {
    className: "small muted"
  }, fmt(t.distanceKm, 1), " km \xB7 ", fmt(t.energyUsedKwh, 1), " kWh \xB7 ", new Date(t.endedAt).toLocaleDateString())), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "b",
    style: {
      color: 'var(--accent)'
    }
  }, "+", fmt(t.pointsEarned)), /*#__PURE__*/React.createElement("div", {
    className: "small muted"
  }, fmt(t.co2SavedKg, 1), " kg CO\u2082")))), !trips.length && /*#__PURE__*/React.createElement("div", {
    className: "muted small"
  }, "No trips yet \u2014 open the Simulator Lab.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("h3", null, "Battery Care"), /*#__PURE__*/React.createElement(Pt, {
    code: pv.powertrain || 'BEV',
    small: true
  })), b && b.recommendations.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    className: r.impact === 'low' ? 'okbox' : 'warnbox',
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: recIcon(r.impact),
    size: 18
  }), /*#__PURE__*/React.createElement("div", null, r.text))), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost row",
    style: {
      marginTop: 6,
      gap: 6
    },
    onClick: () => go('battery')
  }, "Full battery report ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow",
    size: 16
  })))));
}
function Lab({
  me,
  userId,
  onLogged,
  toast
}) {
  const v = me.primaryVehicle || {};
  const pt = v.powertrain || 'BEV';
  const plugIn = (POWERTRAINS[pt] || POWERTRAINS.BEV).plugIn;
  const [p, setP] = useState({
    distanceKm: 25,
    aggression: 0.35,
    regen: 0.6,
    avgSpeedKph: 60,
    parkTemp: 28,
    batteryFriendlyCharge: true
  });
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeTrip(p, pt), [p, pt]);
  const set = k => e => setP(s => ({
    ...s,
    [k]: parseFloat(e.target.value)
  }));
  const tempHot = p.parkTemp >= 35;
  const log = async () => {
    setBusy(true);
    try {
      const res = await api('/api/trips/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          params: {
            distanceKm: p.distanceKm,
            aggression: p.aggression,
            regen: p.regen,
            avgSpeedKph: p.avgSpeedKph,
            batteryFriendlyCharge: p.batteryFriendlyCharge
          }
        })
      });
      toast(`Drive logged · +${fmt(res.trip.pointsEarned)} Eco-Credits · Grade ${res.trip.feedback.grade}`);
      onLogged(res.profile);
    } catch (e) {
      toast('Error: ' + e.message);
    } finally {
      setBusy(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "grid g2",
    style: {
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("h3", null, "Drive Configuration \u2014 ", v.make, " ", v.model), /*#__PURE__*/React.createElement(Pt, {
    code: pt,
    small: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "slider"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, /*#__PURE__*/React.createElement("span", null, "Trip Distance"), /*#__PURE__*/React.createElement("b", null, fmt(p.distanceKm), " km")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "3",
    max: "300",
    step: "1",
    value: p.distanceKm,
    onChange: set('distanceKm')
  })), /*#__PURE__*/React.createElement("div", {
    className: "slider"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, /*#__PURE__*/React.createElement("span", null, "Average Speed"), /*#__PURE__*/React.createElement("b", null, fmt(p.avgSpeedKph), " km/h")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "20",
    max: "130",
    step: "1",
    value: p.avgSpeedKph,
    onChange: set('avgSpeedKph')
  })), /*#__PURE__*/React.createElement("div", {
    className: "slider"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, /*#__PURE__*/React.createElement("span", null, "Driving Aggression"), /*#__PURE__*/React.createElement("b", null, Math.round(p.aggression * 100), "%")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "1",
    step: "0.01",
    value: p.aggression,
    onChange: set('aggression')
  })), /*#__PURE__*/React.createElement("div", {
    className: "slider"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, /*#__PURE__*/React.createElement("span", null, "Regenerative Braking"), /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--accent2)'
    }
  }, Math.round(p.regen * 100), "%")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "1",
    step: "0.01",
    value: p.regen,
    onChange: set('regen')
  })), /*#__PURE__*/React.createElement("div", {
    className: "slider"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, /*#__PURE__*/React.createElement("span", null, "Ambient Parking Temp"), /*#__PURE__*/React.createElement("b", {
    style: {
      color: tempHot ? 'var(--bad)' : 'inherit'
    }
  }, fmt(p.parkTemp), "\xB0C")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "-5",
    max: "48",
    step: "1",
    value: p.parkTemp,
    onChange: set('parkTemp')
  })), plugIn ? /*#__PURE__*/React.createElement("label", {
    className: "row small",
    style: {
      gap: 8,
      marginTop: 6,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: p.batteryFriendlyCharge,
    onChange: e => setP(s => ({
      ...s,
      batteryFriendlyCharge: e.target.checked
    }))
  }), "Charged gently to 80% on AC (battery-friendly bonus +", CFG.CHARGE_BONUS, " pts)") : /*#__PURE__*/React.createElement("div", {
    className: "small muted",
    style: {
      marginTop: 8
    }
  }, "Self-charging hybrid \u2014 no plug-in charging."), tempHot ? /*#__PURE__*/React.createElement("div", {
    className: "warnbox",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert",
    size: 18
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Heat warning."), " Parking at ", fmt(p.parkTemp), "\xB0C accelerates battery degradation. Seek shade or pre-condition the cabin to protect your pack\u2019s State of Health.")) : /*#__PURE__*/React.createElement("div", {
    className: "okbox",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield",
    size: 18
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Battery-safe conditions."), " Parking temperature is within the healthy range for long pack life.")), /*#__PURE__*/React.createElement("button", {
    className: "btn row",
    style: {
      marginTop: 18,
      width: '100%',
      justifyContent: 'center',
      gap: 8
    },
    disabled: busy,
    onClick: log
  }, busy ? /*#__PURE__*/React.createElement("span", {
    className: "spin"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 16
  }), `Log this drive  ·  +${fmt(r.pointsEarned)} credits`))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid g2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, "Net Consumption"), /*#__PURE__*/React.createElement("span", {
    className: "cardicon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "gauge",
    size: 19
  }))), /*#__PURE__*/React.createElement("div", {
    className: "val"
  }, fmt(r.consumption, 1), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "kWh/100km")), /*#__PURE__*/React.createElement("div", {
    className: "delta",
    style: {
      color: p.regen > 0.5 ? 'var(--accent)' : 'var(--muted)'
    }
  }, "Regen recovering ", Math.round(p.regen * 100), "% of losses")), /*#__PURE__*/React.createElement("div", {
    className: "card stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, "Eco Score"), /*#__PURE__*/React.createElement("span", {
    className: "cardicon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flag",
    size: 19
  }))), /*#__PURE__*/React.createElement("div", {
    className: "val",
    style: {
      color: gradeColor(r.ecoScore)
    }
  }, r.ecoScore, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "/100 \xB7 ", gradeOf(r.ecoScore))), /*#__PURE__*/React.createElement("div", {
    className: "delta"
  }, r.harshA + r.harshB, " harsh events predicted"))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Real-Time Impact of This Drive"), /*#__PURE__*/React.createElement("div", {
    className: "grid g3",
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lab small muted"
  }, "CO\u2082 Saved"), /*#__PURE__*/React.createElement("div", {
    className: "b",
    style: {
      fontSize: 22
    }
  }, fmt(r.co2SavedKg, 1), " ", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "kg"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lab small muted"
  }, "Money Saved"), /*#__PURE__*/React.createElement("div", {
    className: "b",
    style: {
      fontSize: 22,
      color: 'var(--accent)'
    }
  }, "$", fmt(r.fuelSaved, 2))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lab small muted"
  }, "Energy Used"), /*#__PURE__*/React.createElement("div", {
    className: "b",
    style: {
      fontSize: 22
    }
  }, fmt(r.energyUsedKwh, 1), " ", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "kWh")))), /*#__PURE__*/React.createElement("div", {
    className: "small muted",
    style: {
      marginTop: 14,
      lineHeight: 1.6
    }
  }, "The ", /*#__PURE__*/React.createElement("b", null, "Regen Incentive Loop"), ": raising regenerative braking offsets the efficiency penalty of aggressive driving \u2014 recovering range ", /*#__PURE__*/React.createElement("i", null, "and"), " multiplying your Eco-Credits. That\u2019s the daily reason to keep optimising.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Eco-Credits Breakdown"), [['Distance', Math.round(p.distanceKm * CFG.POINTS_PER_KM)], ['Eco-driving bonus', Math.round(r.ecoScore / 100 * CFG.ECO_BONUS)], ['CO₂ avoided', Math.round(r.co2SavedKg * CFG.POINTS_PER_KG)], ['Battery-friendly charge', r.chargeBonus]].map(([k, val]) => /*#__PURE__*/React.createElement("div", {
    className: "row between",
    key: k,
    style: {
      padding: '7px 0',
      borderBottom: '1px solid var(--line2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "small muted"
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "b"
  }, "+", fmt(val)))), /*#__PURE__*/React.createElement("div", {
    className: "row between",
    style: {
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "b"
  }, "Total this drive"), /*#__PURE__*/React.createElement("span", {
    className: "b",
    style: {
      color: 'var(--accent)',
      fontSize: 18
    }
  }, "+", fmt(r.pointsEarned))))));
}
function BatteryView({
  me
}) {
  const [data, setData] = useState(null);
  const v = me.primaryVehicle;
  useEffect(() => {
    if (v) api('/api/battery/' + v.id).then(setData);
  }, [me]);
  if (!data) return /*#__PURE__*/React.createElement("div", {
    className: "card muted"
  }, "Loading battery diagnostics\u2026");
  const {
    report: b,
    vehicle
  } = data;
  const pt = vehicle.powertrain || 'BEV';
  const plugIn = (POWERTRAINS[pt] || POWERTRAINS.BEV).plugIn;
  const habit = (label, val, unit, good) => /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between small"
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "b"
  }, val, unit)), /*#__PURE__*/React.createElement(Progress, {
    pct: good
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "grid g3",
    style: {
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between",
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("h3", null, "State of Health"), /*#__PURE__*/React.createElement(Pt, {
    code: pt,
    small: true
  })), /*#__PURE__*/React.createElement(Gauge, {
    value: b.soh,
    color: "grad",
    label: "SoH"
  }), /*#__PURE__*/React.createElement("div", {
    className: "small muted",
    style: {
      marginTop: 6,
      textAlign: 'center'
    }
  }, plugIn ? 'Rated electric range now' : 'Hybrid pack capacity', /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--txt)',
      fontSize: 18
    }
  }, fmt(b.projection.rangeNowKm), " km"), " ", /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "of ", fmt(b.projection.rangeNewKm), " km"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      alignSelf: 'flex-start'
    }
  }, "Battery Care Score"), /*#__PURE__*/React.createElement(Gauge, {
    value: b.careScore,
    color: b.careScore >= 80 ? '#00a14b' : b.careScore >= 60 ? '#c47a08' : '#dc4a5c',
    label: "care"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pill good",
    style: {
      marginTop: 6
    }
  }, b.careScore >= 80 ? 'Excellent habits' : b.careScore >= 60 ? 'Room to improve' : 'At-risk habits')), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Warranty & Projection"), /*#__PURE__*/React.createElement("div", {
    className: "row between",
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted small"
  }, "Warranty status"), /*#__PURE__*/React.createElement("span", {
    className: 'pill ' + (b.warranty.active ? 'good' : 'bad')
  }, b.warranty.active ? 'Active' : 'Expired')), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between small"
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "Years used"), /*#__PURE__*/React.createElement("span", null, b.warranty.yearsUsed, "/", b.warranty.yearsTotal)), /*#__PURE__*/React.createElement(Progress, {
    pct: b.warranty.yearsUsed / b.warranty.yearsTotal * 100
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between small"
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "Distance"), /*#__PURE__*/React.createElement("span", null, fmt(b.warranty.kmUsed), "/", fmt(b.warranty.kmTotal), " km")), /*#__PURE__*/React.createElement(Progress, {
    pct: b.warranty.kmUsed / b.warranty.kmTotal * 100
  })), /*#__PURE__*/React.createElement("div", {
    className: "okbox small",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trend",
    size: 17
  }), /*#__PURE__*/React.createElement("div", null, "Fading ~", /*#__PURE__*/React.createElement("b", null, b.projection.fadePerYearPct, "%/yr"), ". Est. ", /*#__PURE__*/React.createElement("b", null, b.projection.estimatedYearsRemaining, " years"), " until the ", b.warranty.sohFloor, "% warranty floor."))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      gridColumn: 'span 2'
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Your Charging & Usage Habits"), plugIn ? habit('DC fast-charging share', b.habits.fastChargePct, '%', 100 - b.habits.fastChargePct) : /*#__PURE__*/React.createElement("div", {
    className: "okbox small",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "car",
    size: 17
  }), /*#__PURE__*/React.createElement("div", null, "Self-charging hybrid \u2014 the pack is managed automatically with no plug-in charging.")), plugIn && habit('Typical charge ceiling', b.habits.avgChargeCeiling, '%', 100 - Math.max(0, b.habits.avgChargeCeiling - 80) * 5), habit('Avg pack temperature', b.habits.avgTempC, '°C', 100 - Math.max(0, b.habits.avgTempC - 25) * 4), habit('Deep-discharge share', b.habits.deepDischargePct, '%', 100 - b.habits.deepDischargePct * 3), /*#__PURE__*/React.createElement("div", {
    className: "small muted"
  }, "Lifetime equivalent cycles: ", /*#__PURE__*/React.createElement("b", null, fmt(b.habits.cycleCount, 0)))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Personalised Actions"), b.recommendations.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    className: r.impact === 'low' ? 'okbox' : 'warnbox',
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: recIcon(r.impact),
    size: 18
  }), /*#__PURE__*/React.createElement("div", null, r.text, " ", r.impact !== 'low' && /*#__PURE__*/React.createElement("span", {
    className: "pill warn",
    style: {
      marginLeft: 4
    }
  }, r.impact, " impact"))))));
}
function Impact({
  me
}) {
  const i = me.impact;
  const pv = me.primaryVehicle || {};
  return /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid g4"
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Total CO\u2082 Avoided",
    value: fmt(i.totalCo2SavedKg),
    unit: "kg",
    icon: "leaf"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Trees / Year Equiv.",
    value: fmt(i.treesEquivalent, 1),
    unit: "",
    icon: "tree"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Petrol Avoided",
    value: fmt(i.fuelLitresAvoided),
    unit: "L",
    icon: "droplet"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Money Saved",
    value: '$' + fmt(i.costSaved),
    unit: "",
    icon: "wallet"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid g2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("h3", null, "What this means"), /*#__PURE__*/React.createElement(Pt, {
    code: pv.powertrain || 'BEV',
    small: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "okbox",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "globe",
    size: 19
  }), /*#__PURE__*/React.createElement("div", null, "You\u2019ve kept ", /*#__PURE__*/React.createElement("b", null, fmt(i.totalCo2SavedKg), " kg"), " of CO\u2082 out of the atmosphere vs an equivalent petrol car \u2014 the yearly work of ", /*#__PURE__*/React.createElement("b", null, fmt(i.treesEquivalent, 1), " mature trees"), ".")), /*#__PURE__*/React.createElement("div", {
    className: "okbox",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "droplet",
    size: 19
  }), /*#__PURE__*/React.createElement("div", null, "That\u2019s ", /*#__PURE__*/React.createElement("b", null, fmt(i.fuelLitresAvoided), " litres"), " of petrol avoided across ", /*#__PURE__*/React.createElement("b", null, fmt(i.totalDistanceKm), " km"), " of electrified driving.")), /*#__PURE__*/React.createElement("div", {
    className: "okbox"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bulb",
    size: 19
  }), /*#__PURE__*/React.createElement("div", null, "Energy used: ", /*#__PURE__*/React.createElement("b", null, fmt(i.totalEnergyKwh), " kWh"), " on a grid rated at ", /*#__PURE__*/React.createElement("b", null, i.gridIntensity, " kg CO\u2082/kWh"), ". Cleaner grids push these savings even higher."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Distance vs Emissions Avoided"), /*#__PURE__*/React.createElement("div", {
    className: "row between small muted",
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, fmt(i.totalDistanceKm), " km driven"), /*#__PURE__*/React.createElement("span", null, fmt(i.totalCo2SavedKg), " kg saved")), /*#__PURE__*/React.createElement(Bars, {
    data: [{
      v: i.totalDistanceKm
    }, {
      v: i.fuelLitresAvoided * 5
    }, {
      v: i.totalCo2SavedKg * 3
    }, {
      v: i.costSaved * 4
    }, {
      v: i.treesEquivalent * 30
    }]
  }), /*#__PURE__*/React.createElement("div", {
    className: "row between small muted",
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, "km"), /*#__PURE__*/React.createElement("span", null, "fuel"), /*#__PURE__*/React.createElement("span", null, "CO\u2082"), /*#__PURE__*/React.createElement("span", null, "$"), /*#__PURE__*/React.createElement("span", null, "trees")))));
}
function Rewards({
  me,
  userId,
  reload,
  toast
}) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const load = () => api('/api/rewards?userId=' + userId).then(setData);
  useEffect(() => {
    load();
  }, [me, userId]);
  if (!data) return /*#__PURE__*/React.createElement("div", {
    className: "card muted"
  }, "Loading rewards\u2026");
  const redeem = async item => {
    if (data.balance < item.cost) {
      toast('Not enough Eco-Credits yet — keep driving!');
      return;
    }
    setBusy(item.id);
    try {
      const res = await api('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemId: item.id,
          userId
        })
      });
      toast(`Redeemed ${item.name} · code ${res.redemption.code}`);
      await load();
      reload();
    } catch (e) {
      toast('Error: ' + e.message);
    } finally {
      setBusy(null);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid g3"
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Redeemable Balance",
    value: fmt(data.balance),
    unit: "pts",
    icon: "star"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Tier",
    value: data.tier.name,
    unit: "",
    icon: "shield",
    delta: `${data.tier.multiplier}× earning multiplier`
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Rewards Redeemed",
    value: fmt(data.redemptions.length),
    unit: "",
    icon: "gift"
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Rewards Catalogue"), /*#__PURE__*/React.createElement("div", {
    className: "grid g4"
  }, data.catalog.map(item => {
    const can = data.balance >= item.cost;
    return /*#__PURE__*/React.createElement("div", {
      className: "card reward",
      key: item.id,
      style: {
        background: 'var(--panel2)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "rewardic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: item.icon,
      size: 22
    })), /*#__PURE__*/React.createElement("div", {
      className: "b"
    }, item.name), /*#__PURE__*/React.createElement("div", {
      className: "small muted",
      style: {
        minHeight: 34,
        lineHeight: 1.4
      }
    }, item.desc), /*#__PURE__*/React.createElement("div", {
      className: "row between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pill good"
    }, item.category), /*#__PURE__*/React.createElement("span", {
      className: "b"
    }, fmt(item.cost), " pts")), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      style: {
        opacity: can ? 1 : .5
      },
      disabled: !can || busy === item.id,
      onClick: () => redeem(item)
    }, busy === item.id ? /*#__PURE__*/React.createElement("span", {
      className: "spin"
    }) : can ? 'Redeem' : 'Need ' + fmt(item.cost - data.balance) + ' more'));
  }))), data.redemptions.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Redemption History"), /*#__PURE__*/React.createElement("div", {
    className: "tablewrap"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Reward"), /*#__PURE__*/React.createElement("th", null, "Code"), /*#__PURE__*/React.createElement("th", null, "Cost"), /*#__PURE__*/React.createElement("th", null, "Date"))), /*#__PURE__*/React.createElement("tbody", null, data.redemptions.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id
  }, /*#__PURE__*/React.createElement("td", {
    className: "b"
  }, r.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, r.code)), /*#__PURE__*/React.createElement("td", null, fmt(r.cost), " pts"), /*#__PURE__*/React.createElement("td", {
    className: "muted"
  }, new Date(r.redeemedAt).toLocaleDateString()))))))));
}
function Challenges({
  me,
  userId
}) {
  const [data, setData] = useState(null);
  useEffect(() => {
    api('/api/challenges?userId=' + userId).then(setData);
  }, [me, userId]);
  if (!data) return /*#__PURE__*/React.createElement("div", {
    className: "card muted"
  }, "Loading challenges\u2026");
  return /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid g2"
  }, data.challenges.map(c => /*#__PURE__*/React.createElement("div", {
    className: "card",
    key: c.id
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "b",
    style: {
      fontSize: 16
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    className: "small muted"
  }, c.desc)), /*#__PURE__*/React.createElement("span", {
    className: "pill good"
  }, "+", c.reward, " pts")), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '14px 0 8px'
    }
  }, /*#__PURE__*/React.createElement(Progress, {
    pct: c.progress
  })), /*#__PURE__*/React.createElement("div", {
    className: "row between small"
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, c.metric), /*#__PURE__*/React.createElement("span", {
    className: 'b ' + (c.progress >= 100 ? '' : 'muted'),
    style: c.progress >= 100 ? {
      color: 'var(--accent)'
    } : {}
  }, c.progress >= 100 ? 'Complete' : c.progress + '%'))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Badge Collection"), /*#__PURE__*/React.createElement("div", {
    className: "grid g4"
  }, data.badges.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.id,
    className: 'badge' + (b.earned ? ' earned' : '')
  }, /*#__PURE__*/React.createElement("span", {
    className: "bic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: b.icon,
    size: 26
  })), /*#__PURE__*/React.createElement("div", {
    className: "bn"
  }, b.name), /*#__PURE__*/React.createElement("div", {
    className: "bd"
  }, b.desc), b.earned && /*#__PURE__*/React.createElement("span", {
    className: "pill good small"
  }, "Earned"))))));
}
function Leaderboard({
  me,
  userId
}) {
  const [metric, setMetric] = useState('points');
  const [data, setData] = useState(null);
  useEffect(() => {
    api('/api/leaderboard?metric=' + metric).then(setData);
  }, [metric, me]);
  const cols = {
    points: 'Eco-Credits',
    co2SavedKg: 'CO₂ Saved (kg)',
    avgEco: 'Avg Eco',
    distanceKm: 'Distance (km)'
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between",
    style: {
      marginBottom: 12,
      flexWrap: 'wrap',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0
    }
  }, "Community Leaderboard"), /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, Object.keys(cols).map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: metric === k ? 'on' : '',
    onClick: () => setMetric(k)
  }, cols[k].split(' ')[0])))), !data ? /*#__PURE__*/React.createElement("div", {
    className: "muted"
  }, "Loading\u2026") : /*#__PURE__*/React.createElement("div", {
    className: "tablewrap"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "#"), /*#__PURE__*/React.createElement("th", null, "Driver"), /*#__PURE__*/React.createElement("th", null, "Tier"), /*#__PURE__*/React.createElement("th", null, cols[metric]), /*#__PURE__*/React.createElement("th", null, "Eco-Credits"), /*#__PURE__*/React.createElement("th", null, "CO\u2082"))), /*#__PURE__*/React.createElement("tbody", null, data.entries.map(e => /*#__PURE__*/React.createElement("tr", {
    key: e.userId,
    className: e.userId === userId ? 'me' : ''
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "ranknum",
    style: e.rank <= 3 ? {
      background: ['#cf9f2b', '#9aa5b1', '#b08d57'][e.rank - 1],
      color: '#fff'
    } : {}
  }, e.rank)), /*#__PURE__*/React.createElement("td", {
    className: "b"
  }, e.name, e.userId === userId && /*#__PURE__*/React.createElement("span", {
    className: "pill good",
    style: {
      marginLeft: 8
    }
  }, "Viewing")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "pill good"
  }, e.tier)), /*#__PURE__*/React.createElement("td", {
    className: "b"
  }, metric === 'co2SavedKg' ? fmt(e.co2SavedKg) : metric === 'distanceKm' ? fmt(e.distanceKm) : metric === 'avgEco' ? e.avgEco : fmt(e.points)), /*#__PURE__*/React.createElement("td", null, fmt(e.points)), /*#__PURE__*/React.createElement("td", {
    className: "muted"
  }, fmt(e.co2SavedKg), " kg")))))), /*#__PURE__*/React.createElement("div", {
    className: "small muted",
    style: {
      marginTop: 12
    }
  }, "Friendly competition and weekly resets are what turn a tracking app into a daily habit.")));
}

/* ===================== APP SHELL ===================== */
const NAV = [['dash', 'Dashboard', 'grid'], ['lab', 'Simulator Lab', 'sliders'], ['battery', 'Battery Health', 'battery'], ['impact', 'Climate Impact', 'leaf'], ['rewards', 'Rewards', 'gift'], ['challenges', 'Challenges', 'target'], ['board', 'Leaderboard', 'trophy']];
const TITLES = {
  dash: ['Dashboard', 'Your live telematics, impact and loyalty snapshot'],
  lab: ['Simulator Lab', 'Tune your drive and watch wallet, battery and credits respond in real time'],
  battery: ['Battery Health', 'State of Health, warranty and personalised pack-care diagnostics'],
  impact: ['Climate Impact', 'Every electrified kilometre, translated into real-world savings'],
  rewards: ['Rewards', 'Turn your Eco-Credits into charging, service and impact perks'],
  challenges: ['Challenges & Badges', 'Weekly goals and milestones that keep driving rewarding'],
  board: ['Leaderboard', 'See how you stack up against the drivEV community']
};
const TOUR = [['dash', 'Your impact at a glance', 'CO₂ avoided, Eco-Credits, driving grade and battery health — all live and personalised to the driver.'], ['lab', 'The Simulator Lab', 'Drag the sliders and watch energy, money, battery stress and credits respond instantly. This real-time loop is the daily hook.'], ['battery', 'Protect the battery', 'State of Health, warranty tracking and tailored charging advice turn passive data into active asset protection.'], ['impact', 'Real-world savings', 'Every electrified kilometre becomes CO₂, fuel and money saved — the tangible payoff that keeps the app open.'], ['rewards', 'Spend Eco-Credits', 'Redeem real partner perks: charging sessions, car washes, coffee, service credit and more.'], ['challenges', 'Build the habit', 'Weekly challenges, streaks and badges turn one-off tracking into a daily routine.'], ['board', 'Community leaderboard', 'Friendly competition and weekly resets drive engagement across the whole fleet.']];
function Brand({
  small
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bolt",
    size: small ? 18 : 21,
    stroke: 2.2
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "driv", /*#__PURE__*/React.createElement("span", {
    className: "ver"
  }, "EV")), /*#__PURE__*/React.createElement("small", null, "by Yinson GreenTech")));
}
function Onboarding({
  onDone,
  onTour,
  vehicleName
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step === 1) {
      const t = setTimeout(() => setStep(2), 1600);
      return () => clearTimeout(t);
    }
  }, [step]);
  return /*#__PURE__*/React.createElement("div", {
    className: "overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal"
  }, step === 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "logo-xl"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bolt",
    size: 38,
    stroke: 2.2
  })), /*#__PURE__*/React.createElement("h2", null, "Welcome to drivEV"), /*#__PURE__*/React.createElement("p", null, "drivEV\u2019s connected-EV platform \u2014 turning every electrified kilometre into real benefit, and keeping drivers coming back."), /*#__PURE__*/React.createElement("div", {
    className: "feat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "featic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sliders",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Live telematics & eco-coaching"), " \u2014 see exactly how you drive.")), /*#__PURE__*/React.createElement("div", {
    className: "feat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "featic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "battery",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Battery-life protection"), " \u2014 guard your range and resale value.")), /*#__PURE__*/React.createElement("div", {
    className: "feat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "featic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "star",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Eco-Credits & real rewards"), " \u2014 charging, car washes, coffee and more.")), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => setStep(1)
  }, "Connect my vehicle"), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: onDone
  }, "Skip intro")), step === 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "spin-xl"
  }), /*#__PURE__*/React.createElement("h2", null, "Connecting to your vehicle\u2026"), /*#__PURE__*/React.createElement("p", null, "Securely pairing telematics, battery and charging data.")), step === 2 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "connected"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 34,
    stroke: 2.4
  })), /*#__PURE__*/React.createElement("h2", null, "Connected: ", vehicleName || 'your drivEV'), /*#__PURE__*/React.createElement("p", null, "Trip history synced. Your impact, battery health and Eco-Credits are ready to explore."), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onTour
  }, "Take the 60-second tour"), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: onDone
  }, "Explore on my own"))));
}
function Tour({
  step,
  setView,
  next,
  prev,
  done
}) {
  const [v, title, body] = TOUR[step];
  useEffect(() => {
    setView(v);
  }, [step]);
  const last = step === TOUR.length - 1;
  return /*#__PURE__*/React.createElement("div", {
    className: "tourcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "small b",
    style: {
      color: 'var(--accent)',
      letterSpacing: '.5px'
    }
  }, "GUIDED TOUR \xB7 ", step + 1, " of ", TOUR.length), /*#__PURE__*/React.createElement("h3", null, title), /*#__PURE__*/React.createElement("p", null, body), /*#__PURE__*/React.createElement("div", {
    className: "row between"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost small",
    onClick: done
  }, "Skip tour"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 8
    }
  }, step > 0 && /*#__PURE__*/React.createElement("button", {
    className: "btn ghost small",
    onClick: prev
  }, "Back"), /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    onClick: last ? done : next
  }, last ? 'Finish' : 'Next'))));
}
function App() {
  const [view, setView] = useState('dash');
  const [me, setMe] = useState(null);
  const [userId, setUserId] = useState('u_you');
  const [personas, setPersonas] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const [onboard, setOnboard] = useState(() => {
    try {
      return !localStorage.getItem('drivev_onboarded');
    } catch (e) {
      return true;
    }
  });
  const [tourStep, setTourStep] = useState(-1);
  const tRef = useRef();
  const load = uid => api('/api/me?userId=' + (uid || userId)).then(setMe).catch(e => setToastMsg('Load error: ' + e.message));
  useEffect(() => {
    load(userId);
  }, [userId]);
  useEffect(() => {
    api('/api/personas').then(setPersonas).catch(() => {});
  }, []);
  const toast = m => {
    setToastMsg(m);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToastMsg(null), 4200);
  };
  const finishOnboard = () => {
    try {
      localStorage.setItem('drivev_onboarded', '1');
    } catch (e) {}
    setOnboard(false);
  };
  if (!me) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, /*#__PURE__*/React.createElement("div", {
    className: "spin"
  }), "Loading drivEV\u2026");
  const [title, sub] = TITLES[view];
  const pv = me.primaryVehicle || {};
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "side"
  }, /*#__PURE__*/React.createElement(Brand, null), /*#__PURE__*/React.createElement("nav", {
    className: "nav"
  }, NAV.map(([k, label, ic]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: view === k ? 'on' : '',
    onClick: () => setView(k)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 19
  }), label))), /*#__PURE__*/React.createElement("div", {
    className: "side-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "b",
    style: {
      color: 'var(--txt)'
    }
  }, pv.make + ' ' + pv.model), /*#__PURE__*/React.createElement(Pt, {
    code: pv.powertrain || 'BEV',
    small: true
  })), /*#__PURE__*/React.createElement("div", null, fmt(pv.odometerKm), " km \xB7 ", pv.batteryCapacityKwh, " kWh"), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost small row",
    style: {
      marginTop: 12,
      width: '100%',
      justifyContent: 'center',
      gap: 6
    },
    onClick: () => {
      setView('dash');
      setTourStep(0);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh",
    size: 15
  }), "Replay tour"))), /*#__PURE__*/React.createElement("main", {
    className: "main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mobilebrand"
  }, /*#__PURE__*/React.createElement(Brand, {
    small: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "pagetitle"
  }, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("p", null, sub)), /*#__PURE__*/React.createElement("div", {
    className: "chips"
  }, /*#__PURE__*/React.createElement("select", {
    className: "select",
    value: userId,
    onChange: e => setUserId(e.target.value),
    title: "Switch demo persona"
  }, personas.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.name, " \xB7 ", p.powertrain, " \u2014 ", p.persona))), /*#__PURE__*/React.createElement("div", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flame",
    size: 17,
    className: "accent"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, me.loyalty.streak), " ", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "streak"))), /*#__PURE__*/React.createElement("div", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "star",
    size: 17,
    className: "accent"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, fmt(me.loyalty.balance)), " ", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "credits"))), /*#__PURE__*/React.createElement("div", {
    className: "tierbadge",
    style: {
      background: me.loyalty.tier.color
    }
  }, me.loyalty.tier.name))), view === 'dash' && /*#__PURE__*/React.createElement(Dashboard, {
    me: me,
    go: setView
  }), view === 'lab' && /*#__PURE__*/React.createElement(Lab, {
    me: me,
    userId: userId,
    onLogged: setMe,
    toast: toast
  }), view === 'battery' && /*#__PURE__*/React.createElement(BatteryView, {
    me: me
  }), view === 'impact' && /*#__PURE__*/React.createElement(Impact, {
    me: me
  }), view === 'rewards' && /*#__PURE__*/React.createElement(Rewards, {
    me: me,
    userId: userId,
    reload: () => load(userId),
    toast: toast
  }), view === 'challenges' && /*#__PURE__*/React.createElement(Challenges, {
    me: me,
    userId: userId
  }), view === 'board' && /*#__PURE__*/React.createElement(Leaderboard, {
    me: me,
    userId: userId
  })), /*#__PURE__*/React.createElement("nav", {
    className: "mobilenav"
  }, NAV.map(([k, label, ic]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: view === k ? 'on' : '',
    onClick: () => setView(k)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 20
  }), /*#__PURE__*/React.createElement("span", null, label.split(' ')[0])))), onboard && /*#__PURE__*/React.createElement(Onboarding, {
    onDone: finishOnboard,
    vehicleName: pv.make + ' ' + pv.model,
    onTour: () => {
      finishOnboard();
      setView('dash');
      setTourStep(0);
    }
  }), tourStep >= 0 && /*#__PURE__*/React.createElement(Tour, {
    step: tourStep,
    setView: setView,
    next: () => setTourStep(s => s + 1),
    prev: () => setTourStep(s => s - 1),
    done: () => setTourStep(-1)
  }), toastMsg && /*#__PURE__*/React.createElement("div", {
    className: "toast"
  }, /*#__PURE__*/React.createElement("div", {
    className: "b",
    style: {
      marginBottom: 2
    }
  }, "drivEV"), /*#__PURE__*/React.createElement("div", {
    className: "small"
  }, toastMsg)));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));