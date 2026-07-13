const { test, expect } = require("@playwright/test");

test("desktop renders the ordering menu and pinned cart", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://127.0.0.1:3000");

  await expect(page.locator(".section-nav a")).toHaveCount(13);
  await expect(page.locator(".menu-section")).toHaveCount(13);
  await expect(page.locator(".product-list li")).toHaveCount(103);
  await expect(page.locator(".cart-panel")).toBeVisible();
  await expect(page.locator(".cart-panel")).toContainText("السلة فارغة");
});

test("mobile handles add to cart and checkout confirmation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3000");

  await page.locator(".product-list li").first().locator(".add-button").click();
  await expect(page.locator(".floating-cart")).toBeVisible();
  await expect(page.locator(".floating-cart")).toContainText("1");

  await page.locator(".floating-cart").click();
  await expect(page.locator(".cart-panel")).toContainText("شاي");
  await expect(page.locator(".cart-total")).toContainText("100.00");

  await page.locator('input[name="name"]').fill("Test");
  await page.locator('input[name="phone"]').fill("+963947040585");
  await page.locator('textarea[name="address"]').fill("Homs");
  await page.locator(".checkout-submit").click();
  await expect(page.locator(".order-confirmation")).toContainText("SS-");
});
