import { useEffect, useMemo, useRef, useState } from "react";

const BASE_URL = import.meta.env.BASE_URL || "/";
const MENU_SOURCE = assetUrl("data/menu.json");
const INGREDIENT_FALLBACK = "سيتم إضافة المكونات لاحقا.";
const ESTIMATED_TOTAL_LABEL = "السعر المقدر متضمن التوصيل";

const EMPTY_FORM = {
  name: "",
  phone: "",
  neighborhood: "",
  streetAddress: "",
  deliveryCompany: "",
  notes: ""
};
const DELIVERY_COMPANIES = [
  { id: "5g", name: "5G", whatsappNumber: "963930944255" },
  { id: "tbsher", name: "Tbsher - تبشر", whatsappNumber: "963930944255" },
  { id: "fast-delivery", name: "Fast Delivery", whatsappNumber: "963958515311" }
];
const FAST_DELIVERY_PRICES = {
  "ادخار": 290,
  "بابا عمرو": 290,
  "وعر": 290,
  "شبابية": 290,
  "بياضة": 290,
  "وادي الذهب": 290,
  "كرم اللوز": 290,
  "خالدية": 290,
  "السكن الجامعي": 290,
  "غوطة": 230,
  "حمرا": 230,
  "دبلان": 230,
  "جورة الشياح": 230,
  "انشاءات": 230,
  "قرابيص": 230,
  "الحميدية": 230,
  "الملعب": 230,
  "قصور": 230,
  "ميدان": 200,
  "حضارة": 200,
  "كرم الشامي": 200,
  "خضر": 200,
  "المحطة": 200,
  "مشفى الجامعة": 210,
  "اوراس": 650
};
const NEIGHBORHOODS = [
  "حمرا",
  "غوطة",
  "دبلان",
  "كرم الشامي",
  "كرم اللوز",
  "وعر",
  "وادي الذهب",
  "جورة الشياح",
  "قصور",
  "خالدية",
  "انشاءات",
  "ميدان",
  "الحميدية",
  "باب سباع",
  "بياضة",
  "حضارة",
  "ادخار",
  "شبابية",
  "قرابيص",
  "بابا عمرو",
  "الملعب",
  "السكن الجامعي",
  "خضر",
  "المحطة",
  "مشفى الجامعة",
  "اوراس"
].sort((first, second) => first.localeCompare(second, "ar-SY"));
const DELIVERY_AREAS = NEIGHBORHOODS.map((name) => ({
  name,
  deliveryPrices: { "5g": 100, tbsher: 200, "fast-delivery": FAST_DELIVERY_PRICES[name] ?? 300 }
}));
const PHONE_LENGTH = 10;
const THEME_STORAGE_KEY = "sahseh-menu-theme";
const TEXT_ONLY_PATTERN = /^[\p{L}\p{M}\s]+$/u;

function savedTheme() {
  if (typeof window === "undefined") return "light";

  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch (error) {
    return "light";
  }
}

function assetUrl(path) {
  if (!path) return "";
  if (/^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(path)) return path;

  const normalizedBase = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  return `${normalizedBase}${String(path).replace(/^\/+/, "")}`;
}

function sanitizeFormField(name, value) {
  if (name === "phone") return value.replace(/\D/g, "").slice(0, PHONE_LENGTH);
  if (name === "name") return value.replace(/[^\p{L}\p{M}\s]/gu, "");
  return value;
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSearchValue(value) {
  return normalizeText(String(value || ""))
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLocaleLowerCase("ar-SY");
}

function isKnownNeighborhood(value) {
  return DELIVERY_AREAS.some((area) => area.name === value);
}

function isKnownDeliveryCompany(value) {
  return DELIVERY_COMPANIES.some((company) => company.id === value);
}

function deliveryFeeForSelection(neighborhood, company) {
  return DELIVERY_AREAS.find((area) => area.name === neighborhood)?.deliveryPrices[company] || 0;
}

function orderedItems(items = []) {
  return [...items].sort((first, second) => {
    const firstOrder = Number.isFinite(Number(first.order)) ? Number(first.order) : 0;
    const secondOrder = Number.isFinite(Number(second.order)) ? Number(second.order) : 0;
    return firstOrder - secondOrder;
  });
}

function isVisibleInOrdering(item) {
  return item && item.visibleInOrdering !== false;
}

function productPriceText(product) {
  if (product.priceText !== undefined && product.priceText !== null) return String(product.priceText);
  if (Number.isFinite(Number(product.price))) return Number.isInteger(Number(product.price)) ? String(Number(product.price)) : Number(product.price).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return "";
}

function productPrice(product) {
  return Number.isFinite(Number(product.price)) ? Number(product.price) : 0;
}

function formatTotal(value) {
  const amount = Number(value || 0);
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function deliveryCompanyName(value) {
  return DELIVERY_COMPANIES.find((company) => company.id === value)?.name || value;
}

function buildWhatsAppOrderMessage(form, cartItems, finalTotal) {
  const items = cartItems.map(({ product, quantity }) =>
    `${product.name} عدد ${quantity} = ${formatTotal(productPrice(product) * quantity)}`
  ).join("\n");

  const customerSection = [
    `👤 الاسم: ${form.name}`,
    `📞 رقم الهاتف: ${form.phone}`,
    `📍 المنطقة: ${form.neighborhood}`,
    `🏠 الموقع بالتحديد: ${form.streetAddress}`,
    `🚚 خدمة التوصيل: ${deliveryCompanyName(form.deliveryCompany)}`
  ].join("\n");

  const totalSection = [
    `${ESTIMATED_TOTAL_LABEL}: ${formatTotal(finalTotal)}`,
    form.notes ? `📝 ملاحظات: ${form.notes}` : ""
  ].filter(Boolean).join("\n");

  return [
    "🧾 طلب جديد من صَح صِح",
    customerSection,
    ["الطلبات:", items].join("\n"),
    totalSection
  ].join("\n\n");
}

function openWhatsAppOrder(message, deliveryCompany) {
  const phone = DELIVERY_COMPANIES.find((company) => company.id === deliveryCompany)?.whatsappNumber || "963930944255";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
}

function normalizeMenu(menuData) {
  const categories = orderedItems(menuData?.categories || [])
    .filter(isVisibleInOrdering)
    .map((category) => ({
      ...category,
      products: orderedItems(category.products || []).filter(isVisibleInOrdering)
    }))
    .filter((category) => category.products.length > 0);

  return {
    brand: menuData?.brand || {},
    defaults: menuData?.defaults || {},
    categories,
    productsById: categories.reduce((products, category) => {
      category.products.forEach((product) => {
        products[product.id] = { ...product, categoryId: category.id, categoryName: category.name };
      });
      return products;
    }, {})
  };
}

function findProduct(categories, productId) {
  for (const category of categories) {
    const product = category.products.find((item) => item.id === productId);
    if (product) return { ...product, categoryName: category.name };
  }
  return null;
}

function IconButton({ label, children, className = "", ...props }) {
  return (
    <button className={`icon-button ${className}`.trim()} type="button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

function QuantityStepper({ value, onIncrement, onDecrement, decrementLabel, incrementLabel, disabled = false }) {
  return (
    <div className="quantity-stepper" aria-label="الكمية">
      <IconButton label={decrementLabel} onClick={onDecrement} disabled={disabled || value <= 0}>
        <span className="math-sign math-sign-minus" aria-hidden="true" />
      </IconButton>
      <output>{value}</output>
      <IconButton label={incrementLabel} onClick={onIncrement} disabled={disabled}>
        <span className="math-sign math-sign-plus" aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === "light";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-pressed={isLight}
      aria-label={isLight ? "تفعيل النمط الداكن" : "تفعيل النمط الفاتح"}
      title={isLight ? "النمط الداكن" : "النمط الفاتح"}
    >
      <svg className="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 14.4A8.2 8.2 0 0 1 9.6 3a7 7 0 1 0 11.4 11.4Z" />
      </svg>
      <svg className="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
      </svg>
    </button>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-1.5L13 21l-3-1.5L7 21l-2-1V5a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function Header({ brand, itemCount, cartOpen, onCartToggle, theme, onThemeToggle }) {
  return (
    <header className="site-header">
      <a className="brand" href="#menu" aria-label="صَح صِح">
        <img src={assetUrl("assets/brand/brand-art.png")} alt="صح صح" className="brand-logo" />
        <div className="brand-text">
          <h1>{brand.name || "صَح صِح"}</h1>
          <p className="brand-statement">{brand.statement || "بيتك ومطرحك"}</p>
        </div>
      </a>
      <div className="header-actions">
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        <button
          className="cart-trigger"
          type="button"
          onClick={onCartToggle}
          aria-label={cartOpen ? "إخفاء السلة" : "فتح السلة"}
          aria-expanded={cartOpen}
        >
          <CartIcon />
          <strong>{itemCount}</strong>
        </button>
      </div>
    </header>
  );
}

function SectionNav({ categories, onSelectSection }) {
  return (
    <nav className="section-nav" aria-label="أقسام المنيو">
      {categories.map((category) => (
        <button type="button" key={category.id} onClick={() => onSelectSection(category.sectionId)}>
          <img src={assetUrl(category.icon)} alt="" aria-hidden="true" />
          <span className="nav-label">{category.name}</span>
        </button>
      ))}
    </nav>
  );
}

function ProductRow({ product, quantity, onOpen, onAdd, onIncrease, onDecrease }) {
  const available = product.available !== false;

  return (
    <li className={!available ? "is-unavailable" : undefined}>
      <button className="product-open" type="button" onClick={onOpen} aria-label={`عرض تفاصيل ${product.name}`}>
        <span className="product-name">{product.name}</span>
        <span className="price-slot">{productPriceText(product)}</span>
      </button>
      {quantity > 0 ? (
        <QuantityStepper
          value={quantity}
          onIncrement={onIncrease}
          onDecrement={onDecrease}
          decrementLabel={`تقليل ${product.name}`}
          incrementLabel={`زيادة ${product.name}`}
          disabled={!available}
        />
      ) : (
        <button
          className={`add-button ${available ? "add-button-compact" : ""}`.trim()}
          type="button"
          onClick={onAdd}
          disabled={!available}
          aria-label={available ? `إضافة ${product.name} إلى السلة` : undefined}
        >
          {available ? <span className="math-sign math-sign-plus" aria-hidden="true" /> : "غير متوفر"}
        </button>
      )}
    </li>
  );
}

function MenuSection({ category, cartQuantities, onOpenProduct, onAddProduct, onIncreaseProduct, onDecreaseProduct }) {
  return (
    <article className="menu-section" id={category.sectionId}>
      <h2>
        <span className="section-icon">
          <img src={assetUrl(category.icon)} alt="" aria-hidden="true" />
        </span>
        <span>{category.name}</span>
      </h2>
      <ul className="product-list">
        {category.products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            quantity={cartQuantities[product.id] || 0}
            onOpen={() => onOpenProduct(product.id)}
            onAdd={() => onAddProduct(product.id)}
            onIncrease={() => onIncreaseProduct(product.id)}
            onDecrease={() => onDecreaseProduct(product.id)}
          />
        ))}
      </ul>
    </article>
  );
}

function ProductModal({ product, quantity, fallbackIngredients, onClose, onAdd, onIncrease, onDecrease }) {
  if (!product) return null;

  const available = product.available !== false;
  const ingredients = product.ingredients || fallbackIngredients || INGREDIENT_FALLBACK;

  return (
    <div className="product-modal" aria-hidden="false">
      <button className="product-modal-backdrop" type="button" aria-label="إغلاق" onClick={onClose} />
      <section className="product-modal-panel" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div className="product-modal-top">
          <p className="product-modal-price">{productPriceText(product)}</p>
          <div className="product-modal-heading">
            <h2 id="product-modal-title">{product.name}</h2>
          </div>
        </div>
        <div className="product-modal-media">
          {product.image ? (
            <img className="product-modal-image" src={assetUrl(product.image)} alt={product.name} loading="lazy" decoding="async" />
          ) : (
            <div className="product-modal-image-placeholder">
              <span>صورة المنتج</span>
            </div>
          )}
        </div>
        <div className="product-modal-ingredients">
          <h3>المكونات</h3>
          <p>{ingredients}</p>
        </div>
        <div className="product-modal-actions">
          {quantity > 0 ? (
            <QuantityStepper
              value={quantity}
              onIncrement={onIncrease}
              onDecrement={onDecrease}
              decrementLabel={`تقليل ${product.name}`}
              incrementLabel={`زيادة ${product.name}`}
              disabled={!available}
            />
          ) : (
            <button className="primary-button" type="button" onClick={onAdd} disabled={!available}>
              {available ? "إضافة إلى السلة" : "غير متوفر"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function CartLine({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <li className="cart-line">
      <div className="cart-line-main">
        <strong>{item.product.name}</strong>
        <span>{formatTotal(productPrice(item.product) * item.quantity)}</span>
      </div>
      <div className="cart-line-controls">
        <QuantityStepper
          value={item.quantity}
          onIncrement={onIncrease}
          onDecrement={onDecrease}
          decrementLabel={`تقليل ${item.product.name}`}
          incrementLabel={`زيادة ${item.product.name}`}
        />
        <IconButton label={`حذف ${item.product.name}`} className="remove-button" onClick={onRemove}>
          <span className="control-sign" aria-hidden="true">×</span>
        </IconButton>
      </div>
    </li>
  );
}

function CheckoutField({ label, error, as: Control = "input", ...props }) {
  const invalidProps = error === undefined ? {} : { "aria-invalid": Boolean(error) };

  return (
    <label className="field-label">
      <span>{label}</span>
      <Control {...invalidProps} {...props} />
      {error ? <small>{error}</small> : null}
    </label>
  );
}
function CheckoutForm({ form, formErrors, isSubmitting, onChange, onSubmit, disabled, finalTotal }) {
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("");
  const neighborhoodPickerRef = useRef(null);
  const filteredNeighborhoods = useMemo(() => {
    const query = normalizeSearchValue(neighborhoodFilter);
    if (!query) return DELIVERY_AREAS;
    return DELIVERY_AREAS.filter((area) => normalizeSearchValue(area.name).includes(query));
  }, [neighborhoodFilter]);

  function selectNeighborhood(name) {
    onChange({ target: { name: "neighborhood", value: name } });
    setNeighborhoodFilter("");
    setNeighborhoodOpen(false);
  }

  function handleNeighborhoodToggle() {
    setNeighborhoodOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) setNeighborhoodFilter("");
      return nextOpen;
    });
  }

  function handleNeighborhoodTypeKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setNeighborhoodOpen(true);
      return;
    }

    if (event.key === "Enter" && neighborhoodOpen && filteredNeighborhoods.length > 0) {
      event.preventDefault();
      selectNeighborhood(filteredNeighborhoods[0].name);
      return;
    }

    if (event.key === "Escape") {
      setNeighborhoodFilter("");
      setNeighborhoodOpen(false);
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      setNeighborhoodFilter((current) => current.slice(0, -1));
      setNeighborhoodOpen(true);
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      setNeighborhoodFilter((current) => current + event.key);
      setNeighborhoodOpen(true);
    }
  }

  function handleNeighborhoodKeyDown(event) {
    handleNeighborhoodTypeKey(event);
  }

  useEffect(() => {
    if (!neighborhoodOpen) return undefined;

    function handleDocumentKeyDown(event) {
      if (event.target instanceof Element && event.target.closest(".neighborhood-picker")) return;
      handleNeighborhoodTypeKey(event);
    }

    function handleDocumentPointerDown(event) {
      if (neighborhoodPickerRef.current?.contains(event.target)) return;
      setNeighborhoodFilter("");
      setNeighborhoodOpen(false);
    }

    document.addEventListener("keydown", handleDocumentKeyDown);
    document.addEventListener("pointerdown", handleDocumentPointerDown);
    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [neighborhoodOpen, filteredNeighborhoods]);

  return (
    <form className="checkout-form" onSubmit={onSubmit} noValidate>
      <CheckoutField
        label="الاسم"
        name="name"
        type="text"
        value={form.name}
        onChange={onChange}
        autoComplete="name"
        error={formErrors.name}
        placeholder="اسم المستلم"
      />
      <CheckoutField
        label="رقم الهاتف"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={onChange}
        autoComplete="tel"
        inputMode="numeric"
        dir="ltr"
        error={formErrors.phone}
        placeholder="09XXXXXXXX"
      />
      <div className="field-label neighborhood-field">
        <span>المنطقة</span>
        <div className="neighborhood-picker" ref={neighborhoodPickerRef} onKeyDown={handleNeighborhoodKeyDown}>
          <button
            className="neighborhood-select"
            type="button"
            onClick={handleNeighborhoodToggle}
            aria-haspopup="listbox"
            aria-expanded={neighborhoodOpen}
            aria-controls="neighborhood-options"
            aria-invalid={Boolean(formErrors.neighborhood)}
          >
            <span>{form.neighborhood || "اختر المنطقة"}</span>
            <b aria-hidden="true">v</b>
          </button>
          {neighborhoodOpen ? (
            <div className="neighborhood-list" id="neighborhood-options" role="listbox">
              {filteredNeighborhoods.length > 0 ? (
                filteredNeighborhoods.map((area) => (
                  <button
                    className="neighborhood-option"
                    type="button"
                    key={area.name}
                    role="option"
                    aria-selected={form.neighborhood === area.name}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectNeighborhood(area.name)}
                  >
                    {area.name}
                  </button>
                ))
              ) : (
                <span className="neighborhood-empty">لا توجد منطقة مطابقة</span>
              )}
            </div>
          ) : null}
        </div>
        {formErrors.neighborhood ? <small>{formErrors.neighborhood}</small> : null}
      </div>
      <CheckoutField
        as="textarea"
        label="الموقع بالتحديد"
        name="streetAddress"
        value={form.streetAddress}
        onChange={onChange}
        rows={3}
        error={formErrors.streetAddress}
        placeholder="اسم الشارع ، أقرب علامة"
      />
      <fieldset className="delivery-field" aria-invalid={Boolean(formErrors.deliveryCompany)}>
        <legend>خدمة التوصيل</legend>
        <div className="delivery-options">
          {DELIVERY_COMPANIES.map((company) => (
            <label className={`delivery-option ${form.deliveryCompany === company.id ? "is-selected" : ""}`} key={company.id}>
              <input
                type="radio"
                name="deliveryCompany"
                value={company.id}
                checked={form.deliveryCompany === company.id}
                onChange={onChange}
              />
              <span>{company.name}</span>
            </label>
          ))}
        </div>
        {formErrors.deliveryCompany ? <small>{formErrors.deliveryCompany}</small> : null}
      </fieldset>
      <CheckoutField as="textarea" label="ملاحظات" name="notes" value={form.notes} onChange={onChange} rows={2} placeholder="اختياري" />
      <div className="checkout-final" aria-live="polite">
        <span>{ESTIMATED_TOTAL_LABEL}</span>
        <strong>{formatTotal(finalTotal)}</strong>
      </div>
      <button className="primary-button checkout-submit" type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "جاري التحضير..." : "تأكيد الطلب"}
      </button>
    </form>
  );
}

function CartPanel({
  open,
  items,
  total,
  finalTotal,
  form,
  formErrors,
  isSubmitting,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onFormChange,
  onSubmit
}) {
  const empty = items.length === 0;

  return (
    <aside className={`cart-panel ${open ? "is-open" : ""}`} aria-label="السلة والدفع">
      <div className="cart-panel-header">
        <div>
          <p>سلة الطلب</p>
          <strong>{items.reduce((sum, item) => sum + item.quantity, 0)} منتج</strong>
        </div>
        <IconButton label="إغلاق السلة" className="cart-close" onClick={onClose}>
          <span className="control-sign" aria-hidden="true">×</span>
        </IconButton>
      </div>

      {empty ? (
        <div className="empty-cart">
          <strong>السلة فارغة</strong>
          <span>اختر المنتجات من المنيو لإكمال الطلب.</span>
        </div>
      ) : (
        <ul className="cart-lines">
          {items.map((item) => (
            <CartLine
              key={item.product.id}
              item={item}
              onIncrease={() => onIncrease(item.product.id)}
              onDecrease={() => onDecrease(item.product.id)}
              onRemove={() => onRemove(item.product.id)}
            />
          ))}
        </ul>
      )}

      <div className="cart-total">
        <span>مجموع المنتجات</span>
        <strong>{formatTotal(total)}</strong>
      </div>

      <CheckoutForm
        form={form}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        onChange={onFormChange}
        onSubmit={onSubmit}
        disabled={empty}
        finalTotal={finalTotal}
      />
    </aside>
  );
}

function OrderReviewModal({ order, onBack, onConfirm }) {
  if (!order) return null;

  return (
    <div className="order-review-modal" role="dialog" aria-modal="true" aria-labelledby="order-review-title">
      <button className="order-review-backdrop" type="button" aria-label="عودة" onClick={onBack} />
      <section className="order-review-panel">
        <h2 id="order-review-title">معلومات الطلب</h2>
        <pre className="order-review-message">{order.message}</pre>
        <div className="order-review-actions">
          <button className="secondary-button" type="button" onClick={onBack}>عودة</button>
          <button className="primary-button" type="button" onClick={onConfirm}>تأكيد</button>
        </div>
      </section>
    </div>
  );
}

function OrderSuccessModal({ open, onBack, onNewOrder }) {
  if (!open) return null;

  return (
    <div className="order-success-modal" role="dialog" aria-modal="true" aria-labelledby="order-success-title">
      <div className="order-success-backdrop" aria-hidden="true" />
      <section className="order-success-panel">
        <h2 id="order-success-title">تم تأكيد الطلب ✅</h2>
        <div className="order-review-actions">
          <button className="secondary-button" type="button" onClick={onBack}>العودة</button>
          <button className="primary-button" type="button" onClick={onNewOrder}>طلب جديد</button>
        </div>
      </section>
    </div>
  );
}

function Footer({ brand }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>{brand.name || "صَح صِح"}</strong>
        <span>{brand.statement || "بيتك ومطرحك"}</span>
      </div>
      <div className="footer-info">
        <p className="footer-phone"><a href="tel:+963947040585">{brand.phone || "+963 947 040 585"}</a></p>
        <p>{brand.location || "حمص - الميدان - حديقة جامع الدروبي مقابل حلويات أبو اللبن"}</p>
      </div>
      <div className="footer-actions" aria-label="روابط التواصل والموقع">
        <a className="footer-action" href="tel:+963947040585" aria-label="اتصال">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z" />
          </svg>
        </a>
        <a className="footer-action" href="https://www.facebook.com/profile.php?id=61565392680731" target="_blank" rel="noopener" aria-label="فيسبوك">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path className="icon-fill" d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.8-.1-1.7-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3V11H7.3v3h2.8v8h3.4Z" />
          </svg>
        </a>
        <a className="footer-action" href="https://www.instagram.com/sahseh.sy/" target="_blank" rel="noopener" aria-label="إنستغرام">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle className="icon-fill" cx="17.5" cy="6.5" r="1.2" />
          </svg>
        </a>
        <a className="footer-action" href="https://maps.app.goo.gl/wsbRibGtFvHpomdV6?g_st=ic" target="_blank" rel="noopener" aria-label="الموقع على خرائط غوغل">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 10c0 5.2-8 12-8 12S4 15.2 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </a>
      </div>
    </footer>
  );
}

export default function OrderingApp() {
  const [menuData, setMenuData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [theme, setTheme] = useState(savedTheme);
  const [cart, setCart] = useState({});
  const [activeProductId, setActiveProductId] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [backToTopVisible, setBackToTopVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {}
  }, [theme]);

  useEffect(() => {
    let alive = true;

    async function loadMenu() {
      try {
        const response = await fetch(MENU_SOURCE, { cache: "no-cache" });
        if (!response.ok) throw new Error(`Menu request failed with ${response.status}`);
        const nextMenu = await response.json();
        if (alive) setMenuData(normalizeMenu(nextMenu));
      } catch (error) {
        if (alive) setLoadError("تعذر تحميل المنيو.");
      }
    }

    loadMenu();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setActiveProductId(null);
        setCartOpen(false);
      }
    }

    document.body.classList.toggle("modal-open", Boolean(activeProductId || pendingOrder || orderConfirmed));
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeProductId, pendingOrder, orderConfirmed]);

  useEffect(() => {
    function syncCartScrollLock() {
      const shouldLock = cartOpen && window.matchMedia("(max-width: 979px)").matches;
      document.documentElement.classList.toggle("cart-open", shouldLock);
      document.body.classList.toggle("cart-open", shouldLock);
    }

    syncCartScrollLock();
    window.addEventListener("resize", syncCartScrollLock);

    return () => {
      document.documentElement.classList.remove("cart-open");
      document.body.classList.remove("cart-open");
      window.removeEventListener("resize", syncCartScrollLock);
    };
  }, [cartOpen]);

  useEffect(() => {
    const footer = document.querySelector(".site-footer");
    let frame = 0;

    function isFooterInView() {
      if (!footer) return false;
      const rect = footer.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }

    function updateFloatingActions() {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const nextFooterVisible = isFooterInView();
        setFooterVisible(nextFooterVisible);
        setBackToTopVisible(window.scrollY > 240 && !nextFooterVisible);
      });
    }

    let footerObserver = null;
    if (footer && "IntersectionObserver" in window) {
      footerObserver = new IntersectionObserver(updateFloatingActions);
      footerObserver.observe(footer);
    }

    updateFloatingActions();
    window.addEventListener("scroll", updateFloatingActions, { passive: true });
    window.addEventListener("resize", updateFloatingActions);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (footerObserver) footerObserver.disconnect();
      window.removeEventListener("scroll", updateFloatingActions);
      window.removeEventListener("resize", updateFloatingActions);
    };
  }, []);

  const categories = menuData?.categories || [];
  const brand = menuData?.brand || {};
  const fallbackIngredients = menuData?.defaults?.ingredientFallback || INGREDIENT_FALLBACK;

  const activeProduct = useMemo(() => findProduct(categories, activeProductId), [categories, activeProductId]);

  const cartItems = useMemo(() => {
    if (!menuData) return [];

    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = menuData.productsById[productId];
        return product && quantity > 0 ? { product, quantity } : null;
      })
      .filter(Boolean);
  }, [cart, menuData]);

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + productPrice(item.product) * item.quantity, 0),
    [cartItems]
  );
  const deliveryFee = deliveryFeeForSelection(form.neighborhood, form.deliveryCompany);
  const finalTotal = cartTotal + deliveryFee;

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const floatingCartVisible = itemCount > 0 && !footerVisible;

  useEffect(() => {
    if (categories.length === 0) return undefined;

    const sectionId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!sectionId) return undefined;

    const timeout = window.setTimeout(() => {
      scrollToSection(sectionId, "auto");
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [categories.length]);

  function setProductQuantity(productId, nextQuantity) {
    setOrderConfirmed(false);
    setCart((current) => {
      const product = menuData?.productsById?.[productId];
      if (!product || product.available === false) return current;

      const quantity = Math.max(0, Math.min(99, nextQuantity));
      const next = { ...current };
      if (quantity === 0) {
        delete next[productId];
      } else {
        next[productId] = quantity;
      }
      return next;
    });
  }

  function increaseProduct(productId) {
    setProductQuantity(productId, (cart[productId] || 0) + 1);
  }

  function decreaseProduct(productId) {
    setProductQuantity(productId, (cart[productId] || 0) - 1);
  }

  function removeProduct(productId) {
    setProductQuantity(productId, 0);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    const nextValue = sanitizeFormField(name, value);

    setForm((current) => ({ ...current, [name]: nextValue }));

    setFormErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  }

  function validateForm() {
    const errors = {};
    const name = normalizeText(form.name);
    const streetAddress = normalizeText(form.streetAddress);

    if (!name) {
      errors.name = "الاسم مطلوب.";
    } else if (!TEXT_ONLY_PATTERN.test(name)) {
      errors.name = "الاسم يجب أن يحتوي على أحرف فقط.";
    }

    if (!form.phone.trim()) {
      errors.phone = "رقم الهاتف مطلوب.";
    } else if (!/^09\d{8}$/.test(form.phone)) {
      errors.phone = "أدخل رقم موبايل صحيح مثل 09XXXXXXXX.";
    }

    if (!form.neighborhood) {
      errors.neighborhood = "المنطقة مطلوبة.";
    } else if (!isKnownNeighborhood(form.neighborhood)) {
      errors.neighborhood = "اختر المنطقة من القائمة.";
    }

    if (!streetAddress) {
      errors.streetAddress = "الموقع بالتحديد مطلوب.";
    }

    if (!form.deliveryCompany) {
      errors.deliveryCompany = "اختر خدمة توصيل واحدة.";
    } else if (!isKnownDeliveryCompany(form.deliveryCompany)) {
      errors.deliveryCompany = "اختر خدمة توصيل من الخيارات المتاحة.";
    }

    return errors;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting || cartItems.length === 0) return;

    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const message = buildWhatsAppOrderMessage(form, cartItems, finalTotal);
    setPendingOrder({ message, deliveryCompany: form.deliveryCompany });
  }

  function handleConfirmOrder() {
    if (!pendingOrder) return;

    openWhatsAppOrder(pendingOrder.message, pendingOrder.deliveryCompany);
    setOrderConfirmed(true);
    setPendingOrder(null);
  }

  function handleReturnToMenu() {
    setOrderConfirmed(false);
    setPendingOrder(null);
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNewOrder() {
    setOrderConfirmed(false);
    setPendingOrder(null);
    setForm(EMPTY_FORM);
    setCart({});
    setFormErrors({});
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fixedOffset() {
    const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
    return headerHeight + 8;
  }

  function scrollToSection(sectionId, behavior = "smooth") {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const targetTop = window.scrollY + section.getBoundingClientRect().top - fixedOffset();
    window.scrollTo({ top: Math.max(targetTop, 0), behavior });

    if (/^#section-\d+$/i.test(window.location.hash)) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }

  return (
    <>
      <Header
        brand={brand}
        itemCount={itemCount}
        cartOpen={cartOpen}
        onCartToggle={() => setCartOpen((open) => !open)}
        theme={theme}
        onThemeToggle={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      />
      <main className="ordering-shell" id="menu">
        <div className="menu-page">
          {loadError ? <p className="menu-error">{loadError}</p> : null}
          {!menuData && !loadError ? <p className="menu-loading">جاري تحميل المنيو...</p> : null}
          {categories.length > 0 ? (
            <>
              <SectionNav categories={categories} onSelectSection={scrollToSection} />
              <div className="menu-stack">
                {categories.map((category) => (
                  <MenuSection
                    key={category.id}
                    category={category}
                    cartQuantities={cart}
                    onOpenProduct={setActiveProductId}
                    onAddProduct={increaseProduct}
                    onIncreaseProduct={increaseProduct}
                    onDecreaseProduct={decreaseProduct}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="cart-panel-slot">
          <CartPanel
            open={cartOpen}
            items={cartItems}
            total={cartTotal}
            finalTotal={finalTotal}
            form={form}
            formErrors={formErrors}
            isSubmitting={isSubmitting}
            onClose={() => setCartOpen(false)}
            onIncrease={increaseProduct}
            onDecrease={decreaseProduct}
            onRemove={removeProduct}
            onFormChange={handleFormChange}
            onSubmit={handleSubmit}
          />
        </div>
      </main>

      <button
        className={`floating-cart ${floatingCartVisible ? "is-visible" : ""}`}
        type="button"
        onClick={() => setCartOpen(true)}
        aria-label={`فتح السلة - ${itemCount} عناصر - ${formatTotal(finalTotal)}`}
      >
        <CartIcon />
        <strong>{itemCount}</strong>
      </button>
      <button
        className={`back-to-top ${backToTopVisible ? "is-visible" : ""}`}
        type="button"
        aria-label="العودة إلى أعلى الصفحة"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>

      {cartOpen ? <button className="cart-backdrop" type="button" aria-label="إغلاق السلة" onClick={() => setCartOpen(false)} /> : null}

      <OrderReviewModal order={pendingOrder} onBack={() => setPendingOrder(null)} onConfirm={handleConfirmOrder} />
      <OrderSuccessModal open={orderConfirmed} onBack={handleReturnToMenu} onNewOrder={handleNewOrder} />

      <ProductModal
        product={activeProduct}
        quantity={activeProduct ? cart[activeProduct.id] || 0 : 0}
        fallbackIngredients={fallbackIngredients}
        onClose={() => setActiveProductId(null)}
        onAdd={() => activeProduct && increaseProduct(activeProduct.id)}
        onIncrease={() => activeProduct && increaseProduct(activeProduct.id)}
        onDecrease={() => activeProduct && decreaseProduct(activeProduct.id)}
      />

      <Footer brand={brand} />
    </>
  );
}