"use client";

import { useEffect, useMemo, useState } from "react";

const MENU_SOURCE = "/data/menu.json";
const INGREDIENT_FALLBACK = "سيتم إضافة المكونات لاحقا.";
const EMPTY_FORM = {
  name: "",
  phone: "",
  address: "",
  notes: ""
};

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
  if (Number.isFinite(Number(product.price))) return Number(product.price).toFixed(2);
  return "";
}

function productPrice(product) {
  return Number.isFinite(Number(product.price)) ? Number(product.price) : 0;
}

function formatTotal(value) {
  return Number(value || 0).toFixed(2);
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
        <span aria-hidden="true">-</span>
      </IconButton>
      <output>{value}</output>
      <IconButton label={incrementLabel} onClick={onIncrement} disabled={disabled}>
        <span aria-hidden="true">+</span>
      </IconButton>
    </div>
  );
}

function Header({ brand, itemCount, onCartOpen }) {
  return (
    <header className="site-header">
      <a className="brand" href="#menu" aria-label="صَح صِح">
        <img src="/assets/brand/brand-art.png" alt="صح صح" className="brand-logo" />
        <div className="brand-text">
          <h1>{brand.name || "صَح صِح"}</h1>
          <p className="brand-statement">{brand.statement || "بيتك ومطرحك"}</p>
        </div>
      </a>
      <div className="header-actions">
        <a className="phone-link" href="tel:+963947040585">
          {brand.phone || "+963 947 040 585"}
        </a>
        <button className="cart-trigger" type="button" onClick={onCartOpen} aria-label="فتح السلة">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-1.5L13 21l-3-1.5L7 21l-2-1V5a2 2 0 0 1 2-2Z" />
            <path d="M9 8h6M9 12h6M9 16h4" />
          </svg>
          <strong>{itemCount}</strong>
        </button>
      </div>
    </header>
  );
}

function SectionNav({ categories }) {
  return (
    <nav className="section-nav" aria-label="أقسام المنيو">
      {categories.map((category) => (
        <a href={`#${category.sectionId}`} key={category.id}>
          <img src={`/${category.icon}`} alt="" aria-hidden="true" />
          <span className="nav-label">{category.name}</span>
        </a>
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
        <button className="add-button" type="button" onClick={onAdd} disabled={!available}>
          {available ? "إضافة" : "غير متوفر"}
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
          <img src={`/${category.icon}`} alt="" aria-hidden="true" />
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
            <p className="product-modal-category">{product.categoryName}</p>
            <h2 id="product-modal-title">{product.name}</h2>
          </div>
        </div>
        <div className="product-modal-media">
          {product.image ? (
            <img className="product-modal-image" src={`/${product.image}`} alt={product.name} loading="lazy" decoding="async" />
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
          <span aria-hidden="true">x</span>
        </IconButton>
      </div>
    </li>
  );
}

function CheckoutForm({ form, formErrors, isSubmitting, onChange, onSubmit, disabled }) {
  return (
    <form className="checkout-form" onSubmit={onSubmit} noValidate>
      <label>
        <span>الاسم</span>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          autoComplete="name"
          aria-invalid={Boolean(formErrors.name)}
          placeholder="اسم المستلم"
        />
        {formErrors.name ? <small>{formErrors.name}</small> : null}
      </label>
      <label>
        <span>رقم الهاتف</span>
        <input
          name="phone"
          value={form.phone}
          onChange={onChange}
          autoComplete="tel"
          inputMode="tel"
          dir="ltr"
          aria-invalid={Boolean(formErrors.phone)}
          placeholder="+963"
        />
        {formErrors.phone ? <small>{formErrors.phone}</small> : null}
      </label>
      <label>
        <span>العنوان</span>
        <textarea
          name="address"
          value={form.address}
          onChange={onChange}
          rows={3}
          aria-invalid={Boolean(formErrors.address)}
          placeholder="المنطقة، الشارع، أقرب علامة"
        />
        {formErrors.address ? <small>{formErrors.address}</small> : null}
      </label>
      <label>
        <span>ملاحظات</span>
        <textarea name="notes" value={form.notes} onChange={onChange} rows={2} placeholder="اختياري" />
      </label>
      <button className="primary-button checkout-submit" type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "جاري التحضير..." : "تأكيد الطلب التجريبي"}
      </button>
    </form>
  );
}

function CartPanel({
  open,
  items,
  total,
  form,
  formErrors,
  isSubmitting,
  submittedOrder,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onFormChange,
  onSubmit,
  onNewOrder
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
          <span aria-hidden="true">x</span>
        </IconButton>
      </div>

      {submittedOrder ? (
        <section className="order-confirmation">
          <p>تم تسجيل الطلب تجريبياً</p>
          <strong>{submittedOrder}</strong>
          <span>هذا تأكيد تجريبي فقط.</span>
          <button className="primary-button" type="button" onClick={onNewOrder}>
            طلب جديد
          </button>
        </section>
      ) : (
        <>
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
            <span>المجموع</span>
            <strong>{formatTotal(total)}</strong>
          </div>

          <CheckoutForm
            form={form}
            formErrors={formErrors}
            isSubmitting={isSubmitting}
            onChange={onFormChange}
            onSubmit={onSubmit}
            disabled={empty}
          />
        </>
      )}
    </aside>
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
        <a href="tel:+963947040585">{brand.phone || "+963 947 040 585"}</a>
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
  const [cart, setCart] = useState({});
  const [activeProductId, setActiveProductId] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState("");

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

    document.body.classList.toggle("modal-open", Boolean(activeProductId));
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeProductId]);

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

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function setProductQuantity(productId, nextQuantity) {
    setSubmittedOrder("");
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
    setForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  }

  function validateForm() {
    const errors = {};
    if (!form.name.trim()) errors.name = "الاسم مطلوب.";
    if (!form.phone.trim()) errors.phone = "رقم الهاتف مطلوب.";
    if (!form.address.trim()) errors.address = "العنوان مطلوب.";
    return errors;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting || cartItems.length === 0) return;

    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    window.setTimeout(() => {
      setSubmittedOrder(`SS-${Date.now().toString().slice(-6)}`);
      setIsSubmitting(false);
      setCart({});
    }, 600);
  }

  function handleNewOrder() {
    setSubmittedOrder("");
    setForm(EMPTY_FORM);
    setFormErrors({});
    setCartOpen(false);
  }

  return (
    <>
      <Header brand={brand} itemCount={itemCount} onCartOpen={() => setCartOpen(true)} />
      <main className="ordering-shell" id="menu">
        <div className="menu-page">
          {loadError ? <p className="menu-error">{loadError}</p> : null}
          {!menuData && !loadError ? <p className="menu-loading">جاري تحميل المنيو...</p> : null}
          {categories.length > 0 ? (
            <>
              <SectionNav categories={categories} />
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

        <CartPanel
          open={cartOpen}
          items={cartItems}
          total={cartTotal}
          form={form}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          submittedOrder={submittedOrder}
          onClose={() => setCartOpen(false)}
          onIncrease={increaseProduct}
          onDecrease={decreaseProduct}
          onRemove={removeProduct}
          onFormChange={handleFormChange}
          onSubmit={handleSubmit}
          onNewOrder={handleNewOrder}
        />
      </main>

      <button className={`floating-cart ${itemCount > 0 ? "is-visible" : ""}`} type="button" onClick={() => setCartOpen(true)}>
        <span>السلة</span>
        <strong>{itemCount}</strong>
        <b>{formatTotal(cartTotal)}</b>
      </button>

      {cartOpen ? <button className="cart-backdrop" type="button" aria-label="إغلاق السلة" onClick={() => setCartOpen(false)} /> : null}

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
