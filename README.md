# Sahseh Ordering

Sahseh Ordering is the customer-facing Arabic RTL ordering frontend for Sahseh. It shares the visual language and menu data with `../sahseh_menu`, while adding cart, checkout, delivery selection, and WhatsApp click-to-chat ordering.

## How It Works

The React app loads menu data from `public/data/menu.json`, lets customers add products to a cart, collects checkout information, and calculates the final price including the selected delivery service. The customer reviews the order, confirms it, and WhatsApp opens with the order prepared. The customer must press WhatsApp Send manually.

After confirmation, the cart is cleared and a success popup offers `طلب جديد`, which returns the customer to the top of the menu.

## Main Files

- `src/main.jsx`: React entrypoint.
- `src/OrderingApp.jsx`: menu, cart, checkout, delivery pricing, WhatsApp, and modal behavior.
- `src/styles.css`: responsive RTL styling and themes.
- `public/data/menu.json`: synced menu deploy copy.
- `public/assets/`: synced shared assets.
- `tests/order-flow.spec.js`: Playwright smoke coverage.

## Development

Install dependencies, run the Vite development server, and open the local URL shown in the terminal. Validate changes with the project build and browser tests.

## Source And Deployment

Canonical menu data and shared assets are maintained in `../sahseh_source`. Sync changes before deploying this Vite application. The app is a frontend foundation; WhatsApp is the current customer handoff and there is no operational order database or restaurant dashboard.