# Sahseh Ordering

Customer ordering frontend for Sahseh. This app is separate from the static QR menu in `../sahseh_menu`, but the shared visual shell must stay matched to it.

Last reviewed against `index.html`, `src/OrderingApp.jsx`, `src/styles.css`, `public/data/menu.json`, and shared assets on 2026-08-06.

## Role

`sahseh_ordering` is the customer ordering app. It keeps the same Sahseh menu look as `../sahseh_menu`, then adds ordering-only controls: add buttons, plus/minus quantity steppers, a cart/list panel, totals, customer information fields, and a mock confirmation flow.

Do not replace this React app with the static menu. Port shared visual changes from `../sahseh_menu` while preserving the ordering behavior in `src/OrderingApp.jsx`.

## Current Stack

- React + Vite frontend.
- Arabic RTL UI.
- Static menu data served from `public/data/menu.json`.
- Static shared assets served from `public/assets/...`.
- Playwright smoke test in `tests/order-flow.spec.js`.
- FastAPI backend scaffold in `backend/`, not connected to the frontend order submission yet.

## Source Of Truth

Canonical menu data and shared visual assets live in the sibling source repo:

```text
../sahseh_source/
```

Edit source files there first, then sync deploy copies into both app repos. Do not treat `public/data/menu.json` or `public/assets/...` as the canonical source unless the user explicitly requests an emergency app-only fix.

Shared deploy copies expected in this app:

```text
public/data/menu.json
public/assets/brand/brand-art.png
public/assets/brand/brand-art-removebg-preview.png
public/assets/beauty/background-pattern.svg
public/assets/beauty/icons/*.svg
public/assets/img/products/
```

As of this review, shared menu data, brand images, background pattern, icons, and product image placeholders are uniform across `../sahseh_source`, `../sahseh_menu`, and `public/` in this app.

## Project Structure

- `index.html` - Vite HTML shell, Tajawal font preconnect/load, and early persisted-theme initialization.
- `src/main.jsx` - React entrypoint.
- `src/OrderingApp.jsx` - all frontend state and component logic for menu loading, section navigation, product modal, cart, checkout form, mock submit, theme, and back-to-top behavior.
- `src/styles.css` - menu-matched base styling plus ordering-specific cart, button, form, and responsive overrides.
- `public/data/menu.json` - synced deploy copy from `../sahseh_source/data/menu.json`.
- `public/assets/` - synced deploy copy of shared logo/background/icons/product-image directory.
- `backend/` - FastAPI scaffold for future real order API work.
- `tests/order-flow.spec.js` - browser smoke coverage for render counts, section alignment, URL cleanliness, cart, checkout delivery fields, delivery-fee totals, cursor, light-mode badge, and footer phone-link boundary.

## Runtime Behavior

1. `OrderingApp` loads `public/data/menu.json` through `assetUrl("data/menu.json")`, respecting Vite `BASE_URL`.
2. Menu categories and products are sorted by `order` and filtered when `visibleInOrdering === false`.
3. The app renders 13 category controls, 13 menu sections, and 104 products from the current data.
4. Category navigation uses `<button>` elements, not hash links. Clicking a category scrolls to the section without adding `#section-XX` to the URL.
5. If the page is opened with an old `#section-XX` hash, the app scrolls to that section once and then clears the section hash from the URL.
6. Product rows open the product modal when the product name/price area is clicked. The modal title shows only the product name, not the section title.
7. Add buttons and plus/minus steppers update the cart. Product quantities are clamped from 0 to 99.
8. The cart can open from the header cart button or compact mobile floating cart. Desktop uses a fixed cart panel; mobile uses a bottom sheet with backdrop and locks background scrolling while open. The mobile floating cart hides while the footer is visible so footer actions stay reachable.
9. Checkout fields are name, phone, required neighborhood select, required `اسم الشارع .. أقرب علامة` text, required delivery service, optional notes, and a final-price row after notes. Phone input is numeric and must match `09XXXXXXXX`. Name accepts letters/spaces only.
10. Submit is mocked with an `SS-######` confirmation number. There is no real order API call yet.
11. Back-to-top appears after scrolling past 240px and hides while the footer is visible.

## Checkout Delivery Fields

- Neighborhood selection is required and sorted with Arabic locale ordering. It is shown as a select-style list with no visible search field; typing while the list is focused filters by any substring. For example, typing `عر` should show `وعر`.
- Current neighborhoods are: ادخار، انشائات، باب سباع، بابا عمرو، جميدية، جورة الشياح، حضارة، حمرا، خالدية، دبلان، شبابية، غوطة، قصور، كرم الشامي، كرم اللوز، ميدان، وادي الذهب، وعر.
- Street/nearest-landmark text is required and is labeled `اسم الشارع .. أقرب علامة`.
- Delivery service selection is required, labeled `خدمة التوصيل`, and must be exactly one of `5G`, `Tbsher - تبشر`, or `Fast Delivery`.
- Current delivery fees are `5G` = `100.00`, `Tbsher - تبشر` = `200.00`, and `Fast Delivery` = `300.00`.
- `src/OrderingApp.jsx` keeps a delivery area data structure with a per-company `deliveryPrices` slot for every neighborhood, so future pricing can differ by neighborhood and company.
- The final price row appears after notes and shows only the combined product subtotal plus selected delivery service fee. Delivery fees are used in the calculation but are not shown beside company names.

## Theme And Visual Contract

The ordering app should match `../sahseh_menu` for shared visual surfaces:

- Dark mode is the default.
- Light mode is controlled by `html[data-theme="light"]`.
- Theme preference is stored in `localStorage["sahseh-menu-theme"]`, shared with the static menu.
- Header, footer, logo treatment, menu cards, section controls, section icons, price slots, product modal shell, and back-to-top button should stay visually aligned with `../sahseh_menu`.
- Desktop mouse hover effects should stay aligned with `../sahseh_menu` for section controls, product rows, price slots, theme/footer controls, and back-to-top behavior.
- Ordering-only controls such as cart buttons, order buttons, quantity icon buttons, and the mobile floating cart should use the same desktop hover feel while preserving ordering layout. Product add buttons use the arrow-button red in light mode and the section-title dark red in dark mode.
- The back-to-top button should keep the same colors on hover in both themes and only scale slightly on desktop mouse hover.
- The header cart count badge must be a white circle with red text in light mode.
- Buttons should show the normal pointer cursor on hover when enabled.
- Keep Arabic RTL layout and Tajawal font.

Ordering-only UI may differ where necessary: add buttons, plus/minus controls, cart/list panel, totals, checkout fields, validation messages, and mock confirmation.

## Data Contract

`public/data/menu.json` mirrors source schema version 1:

- `schemaVersion: 1`
- `locale: "ar-SY"`
- `direction: "rtl"`
- `currencyCode: "SYP"`
- `brand`
- `defaults`
- `categories`

Each category should include `id`, `sectionId`, `name`, `order`, `icon`, `visibleInDineIn`, `visibleInOrdering`, and `products`.

Each product should include `id`, `name`, `price`, `priceText`, `order`, `image`, `ingredients`, `available`, `visibleInDineIn`, and `visibleInOrdering`.

Current product images and ingredients are not populated. The modal uses the fallback text `سيتم إضافة المكونات لاحقا.` and a placeholder image box.

## Current Counts

- 13 categories.
- 104 products.
- 104 prices.
- 0 populated product images.
- 0 populated product ingredient descriptions.
- No empty price slots.

## Local Development

Frontend:

```powershell
npm install
npm run dev
```

Open the local Vite URL shown in the terminal, usually `http://127.0.0.1:5173`.

Backend scaffold, for future backend work only:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn backend.app.main:app --reload
```

## Validation

Run these after frontend edits:

```powershell
npm run build
npm test
```

Current Playwright expectations include:

- 13 category buttons.
- 13 menu sections.
- 104 product rows.
- Category buttons scroll to sections without leaving `#section-XX` in the URL.
- Enabled buttons have pointer cursor.
- Desktop hover effects work for category buttons, product rows, price slots, ordering buttons, icon buttons, and footer/header controls in dark and light mode.
- Back-to-top hover keeps the same colors in light and dark mode and scales slightly on desktop hover.
- Light-mode header cart count badge is white.
- Desktop cart opens, closes, and preserves entered checkout data, including selected neighborhood, `اسم الشارع .. أقرب علامة`, delivery service, and delivery-fee final total.
- Mobile add-to-cart and checkout validation work, including the compact floating cart hiding at the footer, locked background scrolling while the cart sheet is open, select-only substring-filtered neighborhood selection, `اسم الشارع .. أقرب علامة`, exactly one delivery service, and final total with delivery fee.
- Footer phone text link is limited to the phone text area.

For shared data/assets, also run the source validation script from `../sahseh_source` after syncing source changes.

## Backend Later

Not implemented yet:

- Real order submission.
- Database.
- Restaurant dashboard.
- Admin login.
- Order status updates.
- Delivery notification or delivery integration.

Do not start these phases unless the user explicitly asks.
