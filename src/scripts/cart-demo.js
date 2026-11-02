const renderCart = (demo, quantity) => {
  const addButton = demo.querySelector("[data-cart-add]");
  const stepper = demo.querySelector("[data-cart-stepper]");
  const count = demo.querySelector("[data-cart-count]");
  const decrease = demo.querySelector("[data-cart-decrease]");

  if (!addButton || !stepper || !count || !decrease) return;

  demo.dataset.quantity = String(quantity);
  const hasItems = quantity > 0;
  addButton.hidden = hasItems;
  stepper.hidden = !hasItems;
  count.textContent = `${quantity} in cart`;
  decrease.setAttribute("aria-label", quantity > 1 ? "Decrease quantity" : "Remove from basket");
  decrease.classList.toggle("is-removal", quantity === 1);
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-add], [data-cart-increase], [data-cart-decrease]");
  if (!button) return;

  const demo = button.closest("[data-cart-demo]");
  if (!demo) return;

  const quantity = Number(demo.dataset.quantity ?? 0);
  let nextQuantity = quantity;

  if (button.hasAttribute("data-cart-add")) nextQuantity = 1;
  else if (button.hasAttribute("data-cart-increase")) nextQuantity += 1;
  else if (button.hasAttribute("data-cart-decrease")) nextQuantity = Math.max(0, nextQuantity - 1);

  renderCart(demo, nextQuantity);
  const focusTarget = nextQuantity === 0
    ? demo.querySelector("[data-cart-add]")
    : button.hasAttribute("data-cart-add")
      ? demo.querySelector("[data-cart-decrease]")
      : button;
  focusTarget?.focus();
});
