# Sahseh Ordering

Customer ordering system workspace for Sahseh.

This repo is separate from the static QR menu in `../sahseh_menu`. Shared source menu data and visual assets still live in `../sahseh_source`.

## Current Status

The frontend foundation is built as a React app with Vite. A FastAPI backend scaffold is included for the future ordering API.

Implemented:

- React + Vite frontend.
- Arabic RTL interface.
- Shared Sahseh logo, red/cream styling, background pattern, and category icons.
- Menu loaded from `public/data/menu.json`, synced from `../sahseh_source/data/menu.json`.
- Category and product browsing.
- Product detail modal.
- Add to cart.
- Quantity controls.
- Mobile floating cart.
- Desktop pinned cart.
- Cart total.
- Checkout form for name, phone, address, and notes.
- Mock order confirmation number.
- FastAPI backend scaffold with CORS and health/order placeholder routes.

Not implemented yet:

- Real order submission.
- Database.
- Restaurant dashboard.
- Admin login.
- Order status updates.
- Delivery notification or delivery integration.

## Source Data And Assets

Edit canonical menu data and shared assets in `../sahseh_source` first, then sync deploy copies into this app.

Synced app paths:

```text
public/data/menu.json
public/assets/brand/brand-art.png
public/assets/beauty/
public/assets/img/products/
```

## Project Structure

- `src/` - React frontend source.
- `public/` - synced deploy-copy menu data and shared assets.
- `backend/` - FastAPI service scaffold.
- `tests/order-flow.spec.js` - Playwright smoke test.

## Local Development

Frontend:

```powershell
npm install
npm run dev
```

Open the local Vite URL shown in the terminal, usually `http://127.0.0.1:5173`.

Backend:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn backend.app.main:app --reload
```

## Validation

```powershell
npm run build
npm test
```

The Playwright smoke test starts the Vite dev server automatically and checks that the app renders 13 categories, 103 products, the desktop cart, and the mobile add-to-cart checkout flow.

## Backend Later

After the frontend flow is stable, add backend/database work:

- PostgreSQL.
- Order creation endpoint.
- Restaurant dashboard.
- Admin login.
- Order status updates.
- Delivery notification or delivery integration.

