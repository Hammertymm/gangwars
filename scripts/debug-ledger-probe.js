const fs = require("fs");
const { startStaticServer } = require("./ledger-test-helpers.js");
const { chromium, devices } = require("playwright");

async function probe() {
  await startStaticServer(8775);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8775/gangwars.html");
  await page.evaluate(() => {
    localStorage.setItem("gw:tutorialDone", "1");
    localStorage.setItem(
      "gw:ledger",
      JSON.stringify({
        achievements: { bootlegger: { unlocked: true, revealed: true } },
        masterComplete: false,
      })
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.click("#ledger");
  await page.waitForSelector(".ledger-row-label");

  const home = await page.evaluate(() => {
    const f = document.querySelector(".ledger-art-frame");
    const fr = f.getBoundingClientRect();
    const cs = getComputedStyle(f);
    const img = document.querySelector(".ledger-art-frame img");
    return {
      view: "home",
      imgSrc: img.getAttribute("src"),
      imgNatural: { w: img.naturalWidth, h: img.naturalHeight },
      frame: { w: fr.width, h: fr.height, top: fr.top },
      containerType: cs.containerType,
      labels: [...document.querySelectorAll(".ledger-row-label,.ledger-counter.total")].map(
        (el) => {
          const r = el.getBoundingClientRect();
          const ecs = getComputedStyle(el);
          return {
            cls: el.className,
            text: el.innerText.trim(),
            fontSize: ecs.fontSize,
            lineHeight: ecs.lineHeight,
            overflow: ecs.overflow,
            relTop: ((r.top - fr.top) / fr.height).toFixed(4),
            boxH: (r.height / fr.height).toFixed(4),
            styleTop: el.style.top,
          };
        }
      ),
    };
  });

  await page.click('[data-cat="general"]');
  await page.waitForSelector(".ledger-list-row");

  const cat = await page.evaluate(() => {
    const icons = [...document.querySelectorAll(".ledger-row-icon")];
    const panel = document.querySelector(".ledger-list-panel");
    const pr = panel.getBoundingClientRect();
    const imgEl = icons[0]?.querySelector("img");
    const ir = imgEl?.getBoundingClientRect();
    const ics = imgEl ? getComputedStyle(imgEl) : null;
    return {
      view: "general",
      imgSrc: document.querySelector(".ledger-art-frame img").getAttribute("src"),
      rowCount: document.querySelectorAll(".ledger-list-row").length,
      icons: icons.slice(0, 3).map((el) => {
        const r = el.getBoundingClientRect();
        const imgR = el.querySelector("img")?.getBoundingClientRect();
        const ecs = getComputedStyle(el);
        return {
          wrapW: r.width,
          wrapH: r.height,
          iconW: imgR?.width,
          iconH: imgR?.height,
          flexBasis: ecs.flexBasis,
          iconWVar: ecs.getPropertyValue("--icon-w"),
          rowHVar: ecs.getPropertyValue("--row-h"),
        };
      }),
      firstImgCss: ics ? { width: ics.width, height: ics.height, maxW: ics.maxWidth, maxH: ics.maxHeight } : null,
      panelH: pr.height,
      headerCat: document.querySelector(".ledger-counter.cat")?.innerText,
    };
  });

  const logPath = "debug-5f73c5.log";
  for (const data of [home, cat]) {
    fs.appendFileSync(
      logPath,
      JSON.stringify({
        sessionId: "5f73c5",
        timestamp: Date.now(),
        location: "scripts/debug-ledger-probe.js",
        message: "ledger render probe",
        data,
        hypothesisId: "H-C",
        runId: "probe-iphone13",
      }) + "\n"
    );
  }
  console.log(JSON.stringify({ home, cat }, null, 2));
  await browser.close();
}

probe().catch((e) => {
  console.error(e);
  process.exit(1);
});
