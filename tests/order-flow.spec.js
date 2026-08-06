const { test, expect } = require("@playwright/test");

async function expectSectionAligned(page, sectionId) {
  await page.waitForFunction((targetId) => {
    const header = document.querySelector(".site-header");
    const section = document.querySelector(`#${targetId}`);
    if (!header || !section) return false;

    const gap = section.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
    return gap >= 0 && gap <= 16;
  }, sectionId);
}

async function typeNeighborhoodFilter(select, text) {
  for (const key of [...text]) {
    await select.dispatchEvent("keydown", { key, bubbles: true, cancelable: true });
  }
}

test("desktop renders the ordering menu, aligns hash sections, toggles cart, keeps data, and limits footer phone link", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#section-06");

  await expect(page.locator(".section-nav button")).toHaveCount(13);

  await expect(page.locator(".menu-section")).toHaveCount(13);
  await expect(page.locator(".product-list li")).toHaveCount(104);

  await expectSectionAligned(page, "section-06");
  await expect(page).not.toHaveURL(/#section-\d+$/);
  const firstProductName = (await page.locator(".product-name").first().textContent()).trim();
  const firstSectionTitle = (await page.locator(".menu-section h2").first().textContent()).trim();
  await page.locator(".product-list li").first().locator(".product-open").click();
  await expect(page.locator("#product-modal-title")).toHaveText(firstProductName);
  await expect(page.locator(".product-modal-heading")).not.toContainText(firstSectionTitle);
  await page.keyboard.press("Escape");
  await expect(page.locator(".section-nav button").first()).toHaveCSS("cursor", "pointer");
  await page.locator(".theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".cart-trigger strong")).toHaveCSS("background-color", "rgb(255, 255, 255)");

  await expect(page.locator(".cart-panel")).not.toHaveClass(/is-open/);
  await page.locator(".cart-trigger").click();
  await expect(page.locator(".cart-panel")).toHaveClass(/is-open/);
  await expect(page.locator(".cart-panel")).toContainText("السلة فارغة");

  await page.locator(".product-list li").first().locator(".add-button").click();
  await page.locator('input[name="name"]').fill("Test");
  await page.locator('input[name="phone"]').fill("0947040585");
  const neighborhoodSelect = page.locator(".neighborhood-select");
  const streetInput = page.locator('textarea[name="streetAddress"]');
  await expect(page.locator('input[name="neighborhoodSearch"]')).toHaveCount(0);
  await neighborhoodSelect.click();
  await expect(page.locator(".neighborhood-option")).toHaveCount(18);
  const neighborhoodOptions = (await page.locator(".neighborhood-option").allTextContents()).map((text) => text.trim());
  expect(neighborhoodOptions).toEqual([...neighborhoodOptions].sort((first, second) => first.localeCompare(second, "ar-SY")));
  await typeNeighborhoodFilter(neighborhoodSelect, "عر");
  await expect(page.locator(".neighborhood-option")).toHaveText("وعر");
  await page.locator(".neighborhood-option", { hasText: "وعر" }).click();
  await streetInput.fill("Homs 123, floor #5");
  await page.locator('input[name="deliveryCompany"][value="5g"]').check();
  await expect(page.locator(".checkout-final")).toContainText("200.00");

  await page.locator(".cart-trigger").click();
  await expect(page.locator(".cart-panel")).not.toHaveClass(/is-open/);
  await page.locator(".cart-trigger").click();
  await expect(page.locator(".cart-panel")).toHaveClass(/is-open/);
  await expect(page.getByText("اسم الشارع .. أقرب علامة", { exact: true })).toBeVisible();
  await expect(page.getByText("خدمة التوصيل", { exact: true })).toBeVisible();
  await expect(page.locator(".cart-panel")).toContainText("شاي");
  await expect(page.locator('input[name="name"]')).toHaveValue("Test");
  await expect(page.locator('input[name="phone"]')).toHaveValue("0947040585");
  await expect(neighborhoodSelect).toContainText("وعر");
  await expect(streetInput).toHaveValue("Homs 123, floor #5");
  await expect(page.locator('input[name="deliveryCompany"][value="5g"]')).toBeChecked();

  await page.locator(".section-nav button", { hasText: "بان كيك" }).click();
  await expectSectionAligned(page, "section-08");
  await expect(page).not.toHaveURL(/#section-\d+$/);

  const cartBefore = await page.locator(".cart-panel").boundingBox();
  await page.mouse.wheel(0, 1600);
  await page.waitForTimeout(250);
  const cartAfter = await page.locator(".cart-panel").boundingBox();
  expect(Math.abs(cartAfter.y - cartBefore.y)).toBeLessThan(2);

  const footerInfoBox = await page.locator(".footer-info").boundingBox();
  const footerPhoneBox = await page.locator(".footer-info a").boundingBox();
  expect(footerPhoneBox.width).toBeLessThan(footerInfoBox.width / 2);

  await expect(page.locator(".back-to-top")).toBeVisible();
  await page.locator(".back-to-top").click();
  await page.waitForFunction(() => window.scrollY < 5);
});

test("mobile handles validation, delivery address, add to cart, and checkout confirmation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".product-list li")).toHaveCount(104);

  await page.locator(".product-list li").first().locator(".add-button").click();
  await expect(page.locator(".floating-cart")).toBeVisible();
  await expect(page.locator(".floating-cart")).toContainText("1");
  await expect(page.locator(".floating-cart")).toHaveClass(/is-visible/);
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await expect(page.locator(".floating-cart")).not.toHaveClass(/is-visible/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator(".floating-cart")).toHaveClass(/is-visible/);

  await page.locator(".floating-cart").click();
  await expect(page.locator("body")).toHaveClass(/cart-open/);
  await expect(page.locator(".cart-panel")).toContainText("شاي");
  await expect(page.locator(".cart-total")).toContainText("100.00");

  const nameInput = page.locator('input[name="name"]');
  const phoneInput = page.locator('input[name="phone"]');
  const neighborhoodSelect = page.locator(".neighborhood-select");
  const streetInput = page.locator('textarea[name="streetAddress"]');

  await expect(phoneInput).toHaveAttribute("placeholder", "09XXXXXXXX");
  await expect(page.locator('input[name="neighborhoodSearch"]')).toHaveCount(0);

  await nameInput.fill("Test123");
  await expect(nameInput).toHaveValue("Test");

  await phoneInput.fill("0847040585");
  await streetInput.fill("Homs 123, floor #5");
  await expect(streetInput).toHaveValue("Homs 123, floor #5");
  await page.locator(".checkout-submit").click();
  await expect(page.locator(".checkout-form")).toContainText("09XXXXXXXX");
  await expect(page.locator(".checkout-form")).toContainText("المنطقة مطلوبة");
  await expect(page.locator(".checkout-form")).toContainText("اختر خدمة توصيل واحدة");

  await phoneInput.fill("09abc47040585");
  await expect(phoneInput).toHaveValue("0947040585");

  await neighborhoodSelect.click();
  await typeNeighborhoodFilter(neighborhoodSelect, "عر");
  await expect(page.locator(".neighborhood-option")).toHaveText("وعر");
  await page.locator(".neighborhood-option", { hasText: "وعر" }).click();
  await page.locator('input[name="deliveryCompany"][value="fast-delivery"]').check();
  await expect(page.locator(".checkout-final")).toContainText("400.00");
  await expect(page.locator(".checkout-submit")).toHaveText("تأكيد الطلب");
  await page.locator('textarea[name="notes"]').fill("Floor 2 #5, near door @ 9pm");
  await page.locator(".checkout-submit").click();
  await expect(page.locator(".order-confirmation")).toContainText("SS-");
});
