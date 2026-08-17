# Agent Handoff: Sahseh Ordering

Customer ordering frontend for Sahseh. This app is separate from the static QR menu in `../sahseh_menu`, but the shared visual shell must stay matched to it.

Last reviewed against `index.html`, `src/OrderingApp.jsx`, `src/styles.css`, `public/data/menu.json`, and shared assets on 2026-08-17.

## Role

`sahseh_ordering` is the customer ordering app. It keeps the same Sahseh menu look as `../sahseh_menu`, then adds ordering-only controls: add buttons, plus/minus quantity steppers, a cart/list panel, totals, customer information fields, and WhatsApp click-to-chat checkout.

Do not replace this React app with the static menu. Port shared visual changes from `../sahseh_menu` while preserving the ordering behavior in `src/OrderingApp.jsx`.

## Current Stack

- React + Vite frontend.
- Arabic RTL UI.
- Static menu data served from `public/data/menu.json`.
- Static shared assets served from `public/assets/...`.
- Playwright smoke test in `tests/order-flow.spec.js`.

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
- `src/OrderingApp.jsx` - all frontend state and component logic for menu loading, section navigation, product modal, cart, checkout form, WhatsApp checkout, theme, and back-to-top behavior.
- `src/styles.css` - menu-matched base styling plus ordering-specific cart, button, form, and responsive overrides.
- `public/data/menu.json` - synced deploy copy from `../sahseh_source/data/menu.json`.
- `public/assets/` - synced deploy copy of shared logo/background/icons/product-image directory.
- `tests/order-flow.spec.js` - browser smoke coverage for render counts, section alignment, URL cleanliness, cart, checkout delivery fields, delivery-fee totals, cursor, light-mode badge, and footer phone-link boundary.

## Runtime Behavior

1. `OrderingApp` loads `public/data/menu.json` through `assetUrl("data/menu.json")`, respecting Vite `BASE_URL`.
2. Menu categories and products are sorted by `order` and filtered when `visibleInOrdering === false`.
3. The app renders 13 category controls, 13 menu sections, and 104 products from the current data.
4. Category navigation uses `<button>` elements, not hash links. Clicking a category scrolls to the section without adding `#section-XX` to the URL.
5. If the page is opened with an old `#section-XX` hash, the app scrolls to that section once and then clears the section hash from the URL.
6. Product rows open the product modal when the product name/price area is clicked. The modal title shows only the product name, not the section title.
7. Product row add buttons show only a centered `+` sign when quantity is 0; after adding, the row switches to the `- quantity +` stepper. Product quantities are clamped from 0 to 99.
8. The cart can open from the header cart button or compact mobile floating cart. Desktop uses a fixed cart panel; mobile uses a bottom sheet with backdrop and locks background scrolling while open. The mobile floating cart hides while the footer is visible so footer actions stay reachable.
9. Checkout fields are name, phone, required neighborhood select, required `الموقع بالتحديد` text, required delivery service, optional notes, and a final-price row after notes. Phone input is numeric and must match `09XXXXXXXX`. Name accepts letters/spaces only.
10. After valid checkout, a final review popup shows the same order information and `السعر المقدر متضمن التوصيل`. `عودة` in the review popup preserves the cart and form. `تأكيد` opens the selected company WhatsApp chat with the order prepared, then shows `تم تأكيد الطلب` with `عودة` and `طلب جديد` buttons. `عودة` closes the success popup and returns to the menu while preserving the cart and checkout fields; `طلب جديد` clears the cart/form and returns to the top of the menu. The customer must press WhatsApp Send manually.
11. Back-to-top appears after scrolling past 240px and hides while the footer is visible.

## Checkout Delivery Fields

- Neighborhood selection is required and sorted with Arabic locale ordering. It is shown as a select-style list with no visible search field; typing while the list is focused filters by any substring. For example, typing `عر` should show `وعر`.
- Current neighborhoods are: ادخار، الحميدية، السكن الجامعي، المحطة، الملعب، انشاءات، اوراس، باب سباع، بابا عمرو، بياضة، جورة الشياح، حضارة، حمرا، خالدية، خضر، دبلان، شبابية، غوطة، قرابيص، قصور، كرم الشامي، كرم اللوز، مشفى الجامعة، ميدان، وادي الذهب، وعر.
- Street/nearest-landmark text is required and is labeled `الموقع بالتحديد`.
- Delivery service selection is required, labeled `خدمة التوصيل`, and must be exactly one of `5G`, `Tbsher - تبشر`, or `Fast Delivery`.
- Delivery pricing is represented by a neighborhood-by-company matrix in `src/OrderingApp.jsx`. Every neighborhood has a separate slot for each delivery company. Each company also has its own `whatsappNumber` field. `5G` still uses placeholder delivery fee `100` and placeholder WhatsApp number `963930944255`. `Tbsher - تبشر` uses WhatsApp number `963940655967` (local `0940655967`) and prices, in sorted-neighborhood order: `250`, `160`, `250`, `150`, `150`, `150`, `750`, `200`, `200`, `300`, `150`, `200`, `150`, `180`, `180`, `120`, `300`, `150`, `160`, `180`, `180`, `250`, `180`, `150`, `250`, `300`. `Fast Delivery` uses WhatsApp number `963958515311` (local `0958515311`) and real prices where provided: `290` for ادخار، بابا عمرو، وعر، شبابية، بياضة، وادي الذهب، كرم اللوز، خالدية، السكن الجامعي; `230` for غوطة، حمرا، دبلان، جورة الشياح، انشاءات، قرابيص، الحميدية، الملعب، قصور; `200` for ميدان، حضارة، كرم الشامي، خضر، المحطة; `210` for مشفى الجامعة; `650` for اوراس. باب سباع currently keeps the fallback Fast Delivery fee `300` until its real price is supplied.
- `src/OrderingApp.jsx` keeps a delivery area data structure with a per-company `deliveryPrices` slot for every neighborhood, so future pricing can differ by neighborhood and company.
- The final price row appears after notes and shows only the combined product subtotal plus selected delivery service fee. Delivery fees are used in the calculation but are not shown beside company names.

## Theme And Visual Contract

The ordering app should match `../sahseh_menu` for shared visual surfaces:

- Light mode is the default for first-time visitors.
- Light mode is controlled by `html[data-theme="light"]`.
- Theme preference is stored in `localStorage["sahseh-menu-theme"]`, shared with the static menu.
- Header, footer, logo treatment, menu cards, section controls, section icons, price slots, product modal shell, and back-to-top button should stay visually aligned with `../sahseh_menu`.
- Desktop mouse hover effects should stay aligned with `../sahseh_menu` for section controls, product rows, price slots, theme/footer controls, and back-to-top behavior.
- Ordering-only controls such as cart buttons, order buttons, quantity icon buttons, and the mobile floating cart should use the same desktop hover feel while preserving ordering layout. Product add buttons use the arrow-button red in light mode and the section-title dark red in dark mode.
- Product-row `+` add buttons and all plus/minus steppers use CSS-drawn math signs, not text glyph positioning, so the signs stay visually centered on mobile and desktop.
- Price slots and back-to-top controls inherit the static menu's centered styling. The shared background pattern is the synced transparent tile with light-red strokes from `../sahseh_source`.
- The back-to-top button should keep the same colors on hover in both themes and only scale slightly on desktop mouse hover.
- The header cart count badge must be a white circle with red text in light mode.
- Buttons should show the normal pointer cursor on hover when enabled.
- Keep Arabic RTL layout and Tajawal font.

Ordering-only UI may differ where necessary: add buttons, plus/minus controls, cart/list panel, totals, checkout fields, validation messages, and WhatsApp checkout confirmation.

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
- Desktop cart opens, closes, and preserves entered checkout data, including selected neighborhood, `الموقع بالتحديد`, delivery service, and delivery-fee final total.
- Mobile add-to-cart and checkout validation work, including the compact floating cart hiding at the footer, locked background scrolling while the cart sheet is open, select-only substring-filtered neighborhood selection, `الموقع بالتحديد`, exactly one delivery service, neighborhood/company-specific delivery pricing, and final total with delivery fee.
- Footer phone text link is limited to the phone text area.

For shared data/assets, also run the source validation script from `../sahseh_source` after syncing source changes.

## Agent Handoff Notes

- This is a React 19 and Vite frontend. The active implementation is in `src/OrderingApp.jsx`; styling is in `src/styles.css`; the entrypoint is `src/main.jsx`.
- Shared menu data and visual assets are deploy copies from `../sahseh_source`. Preserve the shared visual parity with `../sahseh_menu` and do not replace this app with the static site.
- Checkout currently supports 26 sorted neighborhoods, substring filtering while the select list is focused, the required `الموقع بالتحديد` field with its existing placeholder, and exactly one delivery company.
- Delivery pricing is stored in a neighborhood-by-company matrix. `5G` still uses placeholder value `100`; `Tbsher - تبشر` and `Fast Delivery` use provided neighborhood-specific prices, with باب سباع still falling back to `300` for Fast Delivery until its real price is supplied. Delivery fees are internal calculation values and are never shown beside company names.
- Each delivery company has its own `whatsappNumber` field. `Tbsher - تبشر` uses `963940655967` (local `0940655967`); `Fast Delivery` uses `963958515311` (local `0958515311`); `5G` still uses the placeholder number `963930944255`.
- The submit flow validates the form, opens a review popup, preserves cart/form state on review `عودة`, and opens the selected company WhatsApp chat only after `تأكيد`. After confirmation, a `تم تأكيد الطلب` popup offers `عودة`, which preserves the same cart/form and returns to the menu, and `طلب جديد`, which resets the form/cart and returns to the top of the menu.
- WhatsApp message sections are separated by one blank line and use restrained formal emojis for the title and customer/delivery fields. The `الطلبات:` section is immediately followed by products, with each product on its own consecutive line using `اسم المنتج عدد X = السعر`. The final line is `السعر المقدر متضمن التوصيل`.
- Preserve mobile background scroll locking while cart or modal overlays are open, desktop/light/dark hover behavior, equal review-popup button sizing, and the existing product/cart accessibility behavior.
- Current smoke expectations are 13 categories, 13 sections, 104 products, 26 neighborhoods, delivery selection, Tbsher and Fast Delivery pricing/WhatsApp routing, review/back/confirm flow, WhatsApp popup opening, success-popup return, and new-order reset.
- There is no backend, database, restaurant dashboard, or automatic WhatsApp send. The customer must press WhatsApp Send manually.
