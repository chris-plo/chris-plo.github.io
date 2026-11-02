import { shirtVariants } from "../data/shirt-variants.mjs";
import { renderProductSwatches } from "./product-swatches-markup.mjs";

const cartDemoMarkup = `<div class="cart-demo article-cart-demo" data-cart-demo>
  <button class="add-to-cart-demo" type="button" data-cart-add aria-label="Add to basket">Add to cart</button>
  <div class="cart-stepper" data-cart-stepper role="group" aria-label="Basket quantity" hidden>
    <button class="cart-stepper-action" type="button" data-cart-decrease aria-label="Remove from basket">
      <svg class="cart-remove-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg>
      <span class="cart-minus-icon" aria-hidden="true">−</span>
    </button>
    <span class="cart-quantity" data-cart-count aria-live="polite">1 in cart</span>
    <button class="cart-stepper-action" type="button" data-cart-increase aria-label="Add one more">+</button>
  </div>
</div>`;

function replaceShortcodes(nodes) {
  for (const node of nodes ?? []) {
    if (node.type === "paragraph" && node.children?.length === 1) {
      const child = node.children[0];
      if (child.type === "text" && child.value.trim() === "[[cart-demo]]") {
        node.type = "html";
        node.value = cartDemoMarkup;
        delete node.children;
        continue;
      }
      if (child.type === "text" && child.value.trim() === "[[product-swatches]]") {
        node.type = "html";
        node.value = renderProductSwatches(shirtVariants, 2);
        delete node.children;
        continue;
      }
    }

    if (node.children) replaceShortcodes(node.children);
  }
}

export default function remarkInteractiveDemos() {
  return (tree) => replaceShortcodes(tree.children);
}
