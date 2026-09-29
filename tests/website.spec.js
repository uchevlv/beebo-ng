import { test, expect } from "@playwright/test";
const local = "http://127.0.0.1:4173";
const connected = "http://127.0.0.1:4174";
const widths = [320, 375, 390, 430, 768, 1024, 1440, 1920];
const fixtureImage = "/src/assets/images/hero/hero-2.jpg";
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
async function mockBackend(
  page,
  {
    owner = true,
    failedLogin = false,
    failCatalog = false,
    failSave = false,
  } = {},
) {
  const state = {
    collections: [
      {
        id: "c1",
        name: "Resurgence",
        slug: "resurgence",
        cover_url: fixtureImage,
        expected_count: 8,
        active: true,
        sort_order: 0,
      },
      {
        id: "c2",
        name: "Éclat",
        slug: "eclat",
        cover_url: fixtureImage,
        expected_count: 9,
        active: true,
        sort_order: 1,
      },
    ],
    products: [
      {
        id: "p1",
        name: "Test Dress",
        collection_id: "c1",
        price: 85000,
        image_url: fixtureImage,
        description: "Test catalogue fixture.",
        active: true,
      },
    ],
    uploads: 0,
    discarded: 0,
  };
  const user = {
    id: "u1",
    aud: "authenticated",
    role: "authenticated",
    email: "owner@example.test",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const token =
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ) +
    "." +
    Buffer.from(
      JSON.stringify({
        sub: "u1",
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: "authenticated",
        aud: "authenticated",
      }),
    ).toString("base64url") +
    ".fixture";
  await page.route("https://beebo-test.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const respond = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    if (url.pathname.includes("/auth/v1/token"))
      return failedLogin
        ? respond({ msg: "Invalid login credentials" }, 400)
        : respond({
            access_token: token,
            refresh_token: "fixture-refresh",
            token_type: "bearer",
            expires_in: 3600,
            user,
          });
    if (url.pathname.includes("/auth/v1/user")) return respond(user);
    if (url.pathname.includes("/auth/v1/logout")) return respond({});
    if (url.pathname.includes("/rpc/is_admin")) return respond(owner);
    if (url.pathname.includes("/storage/v1/object/public/"))
      return route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect width="100" height="140" fill="tan"/></svg>',
      });
    if (url.pathname.includes("/storage/v1/object/")) {
      if (method === "DELETE") state.discarded++;
      else state.uploads++;
      return respond({ Key: "fixture.jpg" });
    }
    const table = url.pathname.split("/").pop();
    if (!["collections", "products"].includes(table)) return respond({});
    if (failCatalog && method === "GET")
      return respond({ message: "Unavailable" }, 500);
    if (method === "GET")
      return respond(
        state[table].filter(
          (row) => url.searchParams.get("active") !== "eq.true" || row.active,
        ),
      );
    const id = url.searchParams.get("id")?.replace("eq.", "");
    if (failSave && method === "POST")
      return respond({ message: "Save failed" }, 500);
    if (method === "DELETE") {
      if (
        table === "collections" &&
        state.products.some((p) => p.collection_id === id)
      )
        return respond({ code: "23503", message: "foreign key" }, 409);
      state[table] = state[table].filter((row) => row.id !== id);
      return respond({ id });
    }
    const body = request.postDataJSON();
    const row = { ...body, id: id || "new-" + table };
    if (method === "POST") state[table].push(row);
    else
      state[table] = state[table].map((item) =>
        item.id === id ? { ...item, ...row } : item,
      );
    return respond(row);
  });
  return state;
}
async function login(page) {
  await page.goto(connected + "/admin");
  await page.getByLabel("Email address").fill("owner@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
test("storefront is responsive and uses real images at every requested width", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of widths) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto(local);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Made for HER",
    );
    await page.locator("#collections").scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll((images) =>
            images.every((image) => image.complete && image.naturalWidth > 0),
          ),
      )
      .toBe(true);
    await noOverflow(page);
    const positions = await page
      .locator(".hero-images img")
      .evaluateAll((images) =>
        images.map((image) => image.getBoundingClientRect().x),
      );
    expect(positions[0]).toBeLessThan(positions[1]);
    expect(positions[1]).toBeLessThan(positions[2]);
    await expect(page.locator(".collection-image").first()).toHaveCSS(
      "object-fit",
      "cover",
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "test-results/home-" + width + ".png",
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
test("menu is compact, keyboard accessible and closes with Escape/outside click", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto(local);
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }).getByRole("link"),
  ).toHaveCount(1);
  expect(
    (await page.locator("#explore-menu").boundingBox()).height,
  ).toBeLessThan(150);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Explore", exact: false }).first(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await page.locator("#hero-title").click();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await page.locator("#explore-menu a").click();
  await expect(page).toHaveURL(local + "/#collections");
});
test("collection links, direct URLs, missing pages, footer and setup state", async ({
  page,
}) => {
  await page.goto(local);
  await page
    .getByRole("link", { name: "Explore Resurgence", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resurgence", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("8 dresses · catalogue coming soon"),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "All collections", exact: false })
    .click();
  await page.getByRole("link", { name: "Explore Éclat", exact: true }).click();
  await expect(
    page.getByText("9 dresses · catalogue coming soon"),
  ).toBeVisible();
  await page.goto(local + "/collections/missing");
  await expect(
    page.getByRole("heading", { name: "Collection not found" }),
  ).toBeVisible();
  await page.goto(local + "/missing");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Email", exact: true }),
  ).toHaveAttribute("href", "mailto:hello@beebong.com");
  await expect(
    page.getByRole("link", { name: "Instagram", exact: false }),
  ).toHaveAttribute("href", "https://www.instagram.com/beebo_ng");
  await page.goto(local + "/admin");
  await expect(
    page.getByRole("heading", { name: "A little setup first." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);
  await page.goto(local);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});
test("product WhatsApp information and product layouts at every width", async ({
  page,
}) => {
  await mockBackend(page);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(connected + "/collections/resurgence");
    const link = page.getByRole("link", { name: "Order on WhatsApp" });
    await expect(link).toBeVisible();
    const url = new URL(await link.getAttribute("href"));
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/2348000000000");
    expect(url.searchParams.get("text")).toBe(
      "Hello Beebo NG, I would like to order the Test Dress from the Resurgence collection priced at ₦85,000.",
    );
    await expect(link).toHaveAttribute("target", "_blank");
    await noOverflow(page);
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: "test-results/product-" + width + ".png",
        fullPage: true,
      });
  }
});
test("catalogue failure is recoverable and does not show false listings", async ({
  page,
}) => {
  await mockBackend(page, { failCatalog: true });
  await page.goto(connected);
  await expect(page.getByRole("alert")).toContainText("could not be loaded");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".collection-card")).toHaveCount(0);
});
test("incorrect credentials show a clear error", async ({ page }) => {
  await mockBackend(page, { failedLogin: true });
  await login(page);
  await expect(page.getByRole("alert")).toContainText("could not sign you in");
});
test("non-owner account cannot open the studio", async ({ page }) => {
  await mockBackend(page, { owner: false });
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Owner access required" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Add Product", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});
test("owner can create, upload, edit, hide and delete a product", async ({
  page,
}) => {
  const state = await mockBackend(page);
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: "test-results/admin-" + width + ".png",
        fullPage: true,
      });
  }
  await page.getByRole("link", { name: "Add Product", exact: true }).click();
  await page.getByLabel("Dress name").fill("New Dress");
  await page.getByLabel("Price (₦)").fill("95000");
  await page.locator("#image").setInputFiles({
    name: "dress.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1kAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByAltText("Selected image preview")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({
    path: "test-results/editor-390.png",
    fullPage: true,
  });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
  }
  await page.getByRole("button", { name: "Save dress", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("New Dress saved");
  expect(state.uploads).toBe(1);
  await page.getByRole("link", { name: "Edit New Dress", exact: true }).click();
  await page.getByLabel("Price (₦)").fill("99000");
  await page.getByLabel("Show this dress").uncheck();
  await page.getByRole("button", { name: "Save dress", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  expect(state.products.find((p) => p.name === "New Dress").price).toBe(99000);
  expect(state.products.find((p) => p.name === "New Dress").active).toBe(false);
  await page
    .getByRole("button", { name: "Delete New Dress", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep it" }).click();
  expect(state.products).toHaveLength(2);
  await page
    .getByRole("button", { name: "Delete New Dress", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("deleted");
  expect(state.products).toHaveLength(1);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});
test("collection editing, safe deletion, creation and image validation", async ({
  page,
}) => {
  const state = await mockBackend(page);
  await login(page);
  await page
    .getByRole("navigation", { name: "Studio navigation" })
    .getByRole("link", { name: "Collections", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete Resurgence", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "still contains dresses",
  );
  await page.getByRole("button", { name: "Keep it" }).click();
  await page.getByRole("link", { name: "Edit Éclat", exact: true }).click();
  await page.getByLabel("Description").fill("Updated description");
  await page
    .getByRole("button", { name: "Save collection", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("saved");
  await page
    .getByRole("link", { name: "Add collection", exact: false })
    .click();
  await page.getByLabel("Collection name").fill("New Collection");
  await page.getByLabel("Collection address").fill("new-collection");
  await page.locator("#image").setInputFiles({
    name: "invalid.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(page.locator("#image-error")).toContainText("Choose a JPG");
  await page.locator("#image").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1kAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page
    .getByRole("button", { name: "Save collection", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("saved");
  expect(state.collections).toHaveLength(3);
  await page
    .getByRole("button", { name: "Delete New Collection", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("deleted");
  expect(state.collections).toHaveLength(2);
});
test("failed save cleans up new upload and preserves the form", async ({
  page,
}) => {
  const state = await mockBackend(page, { failSave: true });
  await login(page);
  await page.getByRole("link", { name: "Add Product", exact: true }).click();
  await page.getByLabel("Dress name").fill("Unsaved dress");
  await page.getByLabel("Price (₦)").fill("80000");
  await page.locator("#image").setInputFiles({
    name: "dress.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1kAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Save dress", exact: true }).click();
  await expect(page.getByRole("alert").first()).toContainText("Save failed");
  await expect(page.getByLabel("Dress name")).toHaveValue("Unsaved dress");
  expect(state.discarded).toBe(1);
});
