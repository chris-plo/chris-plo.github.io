const escapeAttribute = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

export function renderProductSwatches(variants, selectedIndex = 0) {
  if (!variants.length) return "";
  const currentIndex = Math.max(0, Math.min(selectedIndex, variants.length - 1));
  const selected = variants[currentIndex];

  const buttons = variants.map((variant, index) => `
    <button class="product-swatch${index === currentIndex ? " is-selected" : ""}" type="button"
      data-swatch-index="${index}" aria-label="${escapeAttribute(variant.name)}" aria-pressed="${index === currentIndex}"
      style="--swatch-color: ${escapeAttribute(variant.color)}"></button>`).join("");

  return `<div class="product-swatches" data-product-swatches>
    <div class="product-swatches-photo">
      <img class="product-swatches-image is-active" data-swatch-layer data-swatch-image src="${escapeAttribute(selected.image)}"
        alt="${escapeAttribute(`${selected.name} Gildan Ultra Cotton T-shirt`)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
      <img class="product-swatches-image" data-swatch-layer src="" alt="" aria-hidden="true" decoding="async" referrerpolicy="no-referrer">
    </div>
    <div class="product-swatch-list" role="group" aria-label="Choose shirt color" data-swatch-variants="${escapeAttribute(JSON.stringify(variants))}">${buttons}</div>
  </div>`;
}
