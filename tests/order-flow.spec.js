const { test, expect } = require("@playwright/test");

test("desktop renders the ordering menu, toggles cart, keeps cart data, section anchors, and back to top", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await expect(page.locator(".section-nav a")).toHaveCount(13);
  await expect(page.locator(".menu-section")).toHaveCount(13);
  await expect(page.locator(".product-list li")).toHaveCount(103);
  await expect(page.locator(".cart-panel")).not.toHaveClass(/is-open/);

  await page.locator(".cart-trigger").click();
  await expect(page.locator(".cart-panel")).toHaveClass(/is-open/);
  await expect(page.locator(".cart-panel")).toContainText("السلة فارغة");

  await page.locator(".product-list li").first().locator(".add-button").click();
  await page.locator('input[name="name"]').fill("Test");
  await page.locator('input[name="phone"]').fill("0947040585");
  await page.locator('textarea[name="address"]').fill("Homs");

  await page.locator(".cart-trigger").click();
  await expect(page.locator(".cart-panel")).not.toHaveClass(/is-open/);
  await page.locator(".cart-trigger").click();
  await expect(page.locator(".cart-panel")).toHaveClass(/is-open/);
  await expect(page.locator(".cart-panel")).toContainText("شاي");
  await expect(page.locator('input[name="name"]')).toHaveValue("Test");
  await expect(page.locator('input[name="phone"]')).toHaveValue("0947040585");
  await expect(page.locator('textarea[name="address"]')).toHaveValue("Homs");

  await page.locator('.section-nav a[href="#section-06"]').click();
  await page.waitForFunction(() => {
    const header = document.querySelector(".site-header");
    const section = document.querySelector("#section-06");
    if (!header || !section) return false;

    const gap = section.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
    return gap >= 0 && gap <= 16;
  });

  const cartBefore = await page.locator(".cart-panel").boundingBox();
  await page.mouse.wheel(0, 1600);
  await page.waitForTimeout(250);
  const cartAfter = await page.locator(".cart-panel").boundingBox();
  expect(Math.abs(cartAfter.y - cartBefore.y)).toBeLessThan(2);

  await expect(page.locator(".back-to-top")).toBeVisible();
  await page.locator(".back-to-top").click();
  await page.waitForFunction(() => window.scrollY < 5);
});

test("mobile handles validation, add to cart, and checkout confirmation", async ({ page }) => {
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

  await phoneInput.fill("09abc47040585");
  await expect(phoneInput).toHaveValue("0947040585");

  await addressInput.fill("Homs123");
  await expect(addressInput).toHaveValue("Homs");

  await page.locator('textarea[name="notes"]').fill("Floor 2 #5");
  await page.locator(".checkout-submit").click();
  await expect(page.locator(".order-confirmation")).toContainText("SS-");
});
