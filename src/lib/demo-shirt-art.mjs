// Inline SVG product art so the demos need no external images.
const body = "M60 32 L82 20 Q100 34 118 20 L140 32 L182 62 L166 98 L146 88 L146 214 Q100 224 54 214 L54 88 L34 98 L18 62 Z";
const collar = "M82 20 L100 52 L118 20";
const buttons = [64, 92, 120, 148, 176, 202].map((y) => `<circle cx="100" cy="${y}" r="3" fill="#fff" opacity=".85"/>`).join("");

const views = {
  front: (color, shade) => `
    <path d="${body}" fill="${color}"/>
    <path d="${collar}" fill="none" stroke="${shade}" stroke-width="5" stroke-linejoin="round"/>
    <line x1="100" y1="52" x2="100" y2="214" stroke="${shade}" stroke-width="2"/>
    ${buttons}
    <rect x="114" y="74" width="20" height="22" rx="2" fill="none" stroke="${shade}" stroke-width="2"/>`,
  back: (color, shade) => `
    <path d="${body}" fill="${color}"/>
    <path d="M60 50 Q100 64 140 50" fill="none" stroke="${shade}" stroke-width="2"/>
    <path d="M82 20 Q100 30 118 20" fill="none" stroke="${shade}" stroke-width="5"/>
    <line x1="100" y1="62" x2="100" y2="90" stroke="${shade}" stroke-width="2"/>`,
  detail: (color, shade) => `
    <rect width="200" height="240" fill="${color}"/>
    <g stroke="${shade}" stroke-width="2" opacity=".45">${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 16 - 60}" y1="0" x2="${i * 16 + 60}" y2="240"/>`).join("")}</g>
    <path d="M30 0 L100 120 L170 0" fill="${color}" stroke="${shade}" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="100" cy="160" r="9" fill="#fff" stroke="${shade}" stroke-width="2"/>
    <circle cx="100" cy="222" r="9" fill="#fff" stroke="${shade}" stroke-width="2"/>`,
  folded: (color, shade) => `
    <rect x="34" y="70" width="132" height="120" rx="8" fill="${color}"/>
    <path d="M34 92 L166 92" stroke="${shade}" stroke-width="2"/>
    <path d="M78 70 L100 104 L122 70" fill="${color}" stroke="${shade}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="100" cy="130" r="3" fill="#fff"/><circle cx="100" cy="158" r="3" fill="#fff"/>`
};

export const shirtViews = Object.keys(views);

export const shirtSvg = ({ color, shade, view = "front", label }) =>
  `<svg viewBox="0 0 200 240" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="240" fill="#f7f7f7"/>${views[view](color, shade)}</svg>`;
