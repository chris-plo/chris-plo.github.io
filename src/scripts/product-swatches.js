document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-swatch-index]");
  if (!button) return;

  const group = button.closest("[data-swatch-variants]");
  const gallery = button.closest("[data-product-swatches]");
  const layers = gallery?.querySelectorAll("[data-swatch-layer]");
  if (!group || !gallery || !layers || layers.length !== 2) return;

  const variants = JSON.parse(group.dataset.swatchVariants);
  const variant = variants[Number(button.dataset.swatchIndex)];
  if (!variant) return;

  group.querySelectorAll("[data-swatch-index]").forEach((swatch) => {
    const selected = swatch === button;
    swatch.classList.toggle("is-selected", selected);
    swatch.setAttribute("aria-pressed", String(selected));
  });

  const requestId = Number(gallery.dataset.imageRequestId ?? 0) + 1;
  gallery.dataset.imageRequestId = String(requestId);
  const preload = new Image();
  preload.onload = () => {
    if (gallery.dataset.imageRequestId !== String(requestId)) return;

    const image = gallery.querySelector("[data-swatch-layer].is-active");
    const incomingImage = [...layers].find((layer) => layer !== image);
    if (!image || !incomingImage) return;

    incomingImage.src = variant.image;
    incomingImage.alt = `${variant.name} Gildan Ultra Cotton T-shirt`;
    incomingImage.removeAttribute("aria-hidden");
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    requestAnimationFrame(() => {
      image.classList.remove("is-active");
      incomingImage.classList.add("is-active");
    });
  };
  preload.src = variant.image;
});
