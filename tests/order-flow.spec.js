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

test("desktop renders the ordering menu, aligns hash sections, toggles cart, keeps data, and limits footer phone link", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#section-06");

  await expect(page.locator(".section-nav a")).toHaveCount(13);
  await expect(page.locator(".menu-section")).toHaveCount(13);
  await expect(page.locator(".product-list li")).toHaveCount(103);
  await expectSectionAligned(page, "section-06");

  await expect(page.locator(".cart-panel")).not.toHaveClass(/is-open/);
  await page.locator(".cart-trigger").click();
  await expect(page.locator(".cart-panel")).toHaveClass(/is-open/);
  await expect(page.locator(".cart-panel")).toContainText("السلة فارغة");

  await page.locator(".product-list li").first().locator(".add-button").click();
  await page.locator('input[name="name"]').fill("Test");
  await page.locator('input[name="phone"]').fill("0947040585");
  await page.locator('textarea[name="address"]').fill("Homs 123, floor #5");

  await page.locator(".cart-trigger").click();
  await expect(page.locator(".cart-panel")).not.toHaveClass(/is-open/);
  await page.locator(".cart-trigger").click();
  await expect(page.locator(".cart-panel")).toHaveClass(/is-open/);
  await expect(page.locator(".cart-panel")).toContainText("شاي");
  await expect(page.locator('input[name="name"]')).toHaveValue("Test");
  await expect(page.locator('input[name="phone"]')).toHaveValue("0947040585");
  await expect(page.locator('textarea[name="address"]')).toHaveValue("Homs 123, floor #5");

  await page.locator('.section-nav a[href="#section-08"]').click();
  await expectSectionAligned(page, "section-08");

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

test("mobile handles validation, address text, add to cart, and checkout confirmation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.locator(".product-list li").first().locator(".add-button").click();
  await expect(page.locator(".floating-cart")).toBeVisible();
  await expect(page.locator(".floating-cart")).toContainText("1");

  await page.locator(".floating-cart").click();
  await expect(page.locator(".cart-panel")).toContainText("شاي");
  await expect(page.locator(".cart-total")).toContainText("100.00");

  const nameInput = page.locator('input[name="name"]');
  const phoneInput = page.locator('input[name="phone"]');
  const addressInput = page.locator('textarea[name="address"]');

  await expect(phoneInput).toHaveAttribute("placeholder", "09XXXXXXXX");

  await nameInput.fill("Test123");
  await expect(nameInput).toHaveValue("Test");

  await phoneInput.fill("0847040585");
  await addressInput.fill("Homs 123, floor #5");
  await expect(addressInput).toHaveValue("Homs 123, floor #5");
  await page.locator(".checkout-submit").click();
  await expect(page.locator(".checkout-form")).toContainText("09XXXXXXXX");

  await phoneInput.fill("09abc47040585");
  await expect(phoneInput).toHaveValue("0947040585");

  await page.locator('textarea[name="notes"]').fill("Floor 2 #5, near door @ 9pm");
  await page.locator(".checkout-submit").click();
  await expect(page.locator(".order-confirmation")).toContainText("SS-");
});
