# Sahseh Ordering

Sahseh Ordering is the customer-facing Arabic RTL ordering frontend for Sahseh. It shares the visual language and menu data with `../sahseh_menu`, while adding cart, checkout, delivery selection, and WhatsApp click-to-chat ordering.

## How It Works

The React app loads menu data from `public/data/menu.json`, lets customers add products to a cart, collects checkout information, and calculates the final price including the selected delivery service. The customer reviews the order, confirms it, and WhatsApp opens with the order prepared. The customer must press WhatsApp Send manually.

After confirmation, a success popup offers `عودة`, which returns to the menu while preserving the same cart and checkout fields, and `طلب جديد`, which clears the cart/form and returns the customer to the top of the menu.

Delivery options use a neighborhood-by-company pricing matrix. `Tbsher - تبشر` currently uses phone `0940655967` with its provided neighborhood prices. `Fast Delivery` uses phone `0958515311` with its provided neighborhood prices, while `5G` still uses placeholder phone and fee values until its real data is supplied.

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
