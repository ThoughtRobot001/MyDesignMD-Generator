import puppeteer, { type Browser, type Page } from "puppeteer";
import { buildImageAnalysisPrompt, buildUrlAnalysisPrompt } from "../claude/prompts";
import { aiClient } from "../claude/client";
import type { UrlParseInput } from "../types/api";
import type { ColorToken, ComponentToken, DesignTokens, SpacingScale, SpacingToken, TypographyToken } from "../types/design-tokens";

const CSS_LIMIT = 30_000;
const HTML_LIMIT = 8_000;
const DEFAULT_SPACING_NAMES = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });
  }

  return browserInstance;
}

export class UrlParserError extends Error {
  /** Creates a typed URL parser error with an optional cause. */
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "UrlParserError";
  }
}

/** Parses a website URL into normalized design tokens. */
export async function parseFromUrl(input: UrlParseInput): Promise<DesignTokens> {
  console.time("1-scrapeWebsite");
  let scrapeResult!: Awaited<ReturnType<typeof scrapeWebsite>>;
  try {
    scrapeResult = await scrapeWebsite(input.websiteUrl);
  } finally {
    console.timeEnd("1-scrapeWebsite");
  }

  const { css, html, screenshot, componentData, behavioralData } = scrapeResult;
  console.time("3-claude-tokens");
  let tokens: DesignTokens;
  try {
    tokens = await callClaudeForTokens(css, html, screenshot, behavioralData);
  } finally {
    console.timeEnd("3-claude-tokens");
  }
  tokens.components = componentData;

  return {
    ...tokens,
    spacing: inferSpacingScale(tokens),
    meta: {
      source: "url",
      extractedAt: new Date().toISOString(),
      confidence: 0.7,
      warnings: tokens.meta?.warnings ?? [],
      behavioralIntelligence: behavioralData,
    },
  };
}

/** Scrapes rendered CSS, body HTML, a viewport screenshot, and component data from a website URL. */
async function scrapeWebsite(url: string): Promise<{ css: string; html: string; screenshot: string; componentData: ComponentToken[]; behavioralData: string }> {
  const browser = await getBrowser();
  const cssRules = new Set<string>();
  // Maps semantic element role → array of rgb color values accumulated across all scraped pages.
  const semanticColorMap = new Map<string, string[]>();
  const htmlParts: string[] = [];

  /** Scrapes a single rendered page and optionally captures a screenshot. */
  async function scrapePage(pageUrl: string, isRequired: boolean): Promise<string | null> {
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1440, height: 900 });
      const response = await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });

      if (response?.status() === 404) {
        if (isRequired) {
          throw new UrlParserError(`The primary URL returned 404: ${pageUrl}`);
        }

        return null;
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
      const pageCssRules = await page.evaluate(() => {
        const rules: string[] = [];

        for (const sheet of Array.from(document.styleSheets)) {
          try {
            rules.push(...Array.from(sheet.cssRules).map((rule) => rule.cssText));
          } catch {
            // Cross-origin stylesheets are skipped by the browser.
          }
        }

        return rules;
      });
      const pageHtml = await page.evaluate(() => document.body.innerHTML);
      const pageSemanticColors = await page.evaluate(() => {
        const colorMap: Record<string, string[]> = {};
        const sampleElements = [
          { selector: "h1, h2, h3", role: "heading-text" },
          { selector: "p, li, span", role: "body-text" },
          { selector: "a", role: "link" },
          { selector: "button, [role='button']", role: "button-bg" },
          { selector: "nav, header", role: "nav-bg" },
          { selector: "footer", role: "footer-bg" },
          { selector: "input, textarea, select", role: "input-bg" },
          { selector: "[class*='card'], [class*='panel']", role: "card-bg" },
          { selector: "[class*='badge'], [class*='tag'], [class*='chip']", role: "badge-bg" },
          { selector: "[class*='error'], [class*='danger']", role: "error" },
          { selector: "[class*='success']", role: "success" },
          { selector: "[class*='muted'], [class*='secondary']", role: "muted-text" },
          { selector: "hr, [class*='divider'], [class*='separator']", role: "border" },
        ];

        sampleElements.forEach(({ selector, role }) => {
          const els = document.querySelectorAll(selector);
          if (els.length === 0) return;

          const el = els[0];
          const styles = window.getComputedStyle(el);
          const colors: string[] = [];

          ["color", "background-color", "border-color"].forEach((prop) => {
            const val = styles.getPropertyValue(prop);
            if (
              val &&
              val !== "rgba(0, 0, 0, 0)" &&
              val !== "transparent" &&
              val !== "inherit"
            ) {
              colors.push(val);
            }
          });

          if (colors.length > 0) {
            colorMap[role] = colors;
          }
        });

        return colorMap;
      });

      pageCssRules.forEach((rule) => cssRules.add(rule));
      // Merge this page's semantic colors into the shared map (first page wins per role).
      Object.entries(pageSemanticColors).forEach(([role, colors]) => {
        if (!semanticColorMap.has(role)) {
          semanticColorMap.set(role, colors.map(rgbStringToHex));
        }
      });
      htmlParts.push(pageHtml);

      if (!isRequired) {
        return null;
      }

      return await page.screenshot({ fullPage: false, type: "png", encoding: "base64" });
    } catch (error) {
      if (isRequired) {
        try {
          const retryResponse = await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });

          if (retryResponse?.status() === 404) {
            throw new UrlParserError(`The primary URL returned 404: ${pageUrl}`);
          }

          await new Promise((resolve) => setTimeout(resolve, 800));
          const pageCssRules = await page.evaluate(() => {
            const rules: string[] = [];

            for (const sheet of Array.from(document.styleSheets)) {
              try {
                rules.push(...Array.from(sheet.cssRules).map((rule) => rule.cssText));
              } catch {
                // Cross-origin stylesheets are skipped by the browser.
              }
            }

            return rules;
          });
          const pageHtml = await page.evaluate(() => document.body.innerHTML);
          const pageSemanticColors = await page.evaluate(() => {
            const colorMap: Record<string, string[]> = {};
            const sampleElements = [
              { selector: "h1, h2, h3", role: "heading-text" },
              { selector: "p, li, span", role: "body-text" },
              { selector: "a", role: "link" },
              { selector: "button, [role='button']", role: "button-bg" },
              { selector: "nav, header", role: "nav-bg" },
              { selector: "footer", role: "footer-bg" },
              { selector: "input, textarea, select", role: "input-bg" },
              { selector: "[class*='card'], [class*='panel']", role: "card-bg" },
              { selector: "[class*='badge'], [class*='tag'], [class*='chip']", role: "badge-bg" },
              { selector: "[class*='error'], [class*='danger']", role: "error" },
              { selector: "[class*='success']", role: "success" },
              { selector: "[class*='muted'], [class*='secondary']", role: "muted-text" },
              { selector: "hr, [class*='divider'], [class*='separator']", role: "border" },
            ];

            sampleElements.forEach(({ selector, role }) => {
              const els = document.querySelectorAll(selector);
              if (els.length === 0) return;

              const el = els[0];
              const styles = window.getComputedStyle(el);
              const colors: string[] = [];

              ["color", "background-color", "border-color"].forEach((prop) => {
                const val = styles.getPropertyValue(prop);
                if (
                  val &&
                  val !== "rgba(0, 0, 0, 0)" &&
                  val !== "transparent" &&
                  val !== "inherit"
                ) {
                  colors.push(val);
                }
              });

              if (colors.length > 0) {
                colorMap[role] = colors;
              }
            });

            return colorMap;
          });

          pageCssRules.forEach((rule) => cssRules.add(rule));
          // Merge this page's semantic colors into the shared map (first page wins per role).
          Object.entries(pageSemanticColors).forEach(([role, colors]) => {
            if (!semanticColorMap.has(role)) {
              semanticColorMap.set(role, colors.map(rgbStringToHex));
            }
          });
          htmlParts.push(pageHtml);

          return await page.screenshot({ fullPage: false, type: "png", encoding: "base64" });
        } catch (retryError) {
          throw new UrlParserError(`Could not scrape the primary URL: ${pageUrl}`, retryError);
        }
      }

      return null;
    } finally {
      await page.close();
    }
  }

  const primaryPage = await browser.newPage();
  let componentData: ComponentToken[];
  let behavioralData: string;
  let screenshot: string;

  try {
    await primaryPage.setViewport({ width: 1440, height: 900 });
    const response = await primaryPage.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });

    if (response?.status() === 404) {
      throw new UrlParserError(`The primary URL returned 404: ${url}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    console.time("2-parallel-analysis");
    const [scrapedComponents, behavioralDataRaw, fontReport, pageAssets, pageScreenshot] = await Promise.all([
      scrapeComponents(primaryPage),
      analyzeDesignPatterns(primaryPage),
      detectFonts(primaryPage),
      extractPageAssets(primaryPage),
      primaryPage.screenshot({ fullPage: false, type: "png", encoding: "base64" }),
    ]);
    console.timeEnd("2-parallel-analysis");
    componentData = scrapedComponents;
    behavioralData = behavioralDataRaw + "\n\n" + fontReport;
    screenshot = pageScreenshot;
    pageAssets.cssRules.forEach((rule) => cssRules.add(rule));
    Object.entries(pageAssets.semanticColors).forEach(([role, colors]) => {
      if (!semanticColorMap.has(role)) {
        semanticColorMap.set(role, colors.map(rgbStringToHex));
      }
    });
    htmlParts.push(pageAssets.html);
  } catch (error) {
    throw new UrlParserError(`Could not scrape the primary URL: ${url}`, error);
  } finally {
    await primaryPage.close();
  }
  // Keep pre-processed signals ahead of the raw CSS extract so truncation only
  // affects lower-value stylesheet volume.
  const semanticColorBlock =
    "/* SEMANTIC COLORS BY ELEMENT ROLE */\n" +
    Array.from(semanticColorMap.entries())
      .map(([role, colors]) => `${role}: ${colors.join(", ")}`)
      .join("\n");
  const behavioralIntelligenceBlock = `/* BEHAVIORAL INTELLIGENCE */\n${behavioralData}`;
  const strippedCssRules = stripCssNoise(Array.from(cssRules).join("\n"));
  const combinedCss = `${semanticColorBlock}\n\n${behavioralIntelligenceBlock}\n\n/* RAW CSS EXTRACT */\n${strippedCssRules.slice(0, CSS_LIMIT)}`;

  return {
    css: combinedCss,
    html: htmlParts.join("\n").slice(0, HTML_LIMIT),
    screenshot,
    componentData,
    behavioralData,
  };
}

/** Extracts CSS rules, body HTML, and semantic colors from an already loaded page. */
async function extractPageAssets(page: Page): Promise<{ cssRules: string[]; html: string; semanticColors: Record<string, string[]> }> {
  return page.evaluate(() => {
    const cssRules: string[] = [];

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        cssRules.push(...Array.from(sheet.cssRules).map((rule) => rule.cssText));
      } catch {
        // Cross-origin stylesheets are skipped by the browser.
      }
    }

    const semanticColors: Record<string, string[]> = {};
    const sampleElements = [
      { selector: "h1, h2, h3", role: "heading-text" },
      { selector: "p, li, span", role: "body-text" },
      { selector: "a", role: "link" },
      { selector: "button, [role='button']", role: "button-bg" },
      { selector: "nav, header", role: "nav-bg" },
      { selector: "footer", role: "footer-bg" },
      { selector: "input, textarea, select", role: "input-bg" },
      { selector: "[class*='card'], [class*='panel']", role: "card-bg" },
      { selector: "[class*='badge'], [class*='tag'], [class*='chip']", role: "badge-bg" },
      { selector: "[class*='error'], [class*='danger']", role: "error" },
      { selector: "[class*='success']", role: "success" },
      { selector: "[class*='muted'], [class*='secondary']", role: "muted-text" },
      { selector: "hr, [class*='divider'], [class*='separator']", role: "border" },
    ];

    sampleElements.forEach(({ selector, role }) => {
      const element = document.querySelector(selector);
      if (!element) return;

      const styles = window.getComputedStyle(element);
      const colors = ["color", "background-color", "border-color"]
        .map((prop) => styles.getPropertyValue(prop))
        .filter((value) => (
          value &&
          value !== "rgba(0, 0, 0, 0)" &&
          value !== "transparent" &&
          value !== "inherit"
        ));

      if (colors.length > 0) {
        semanticColors[role] = colors;
      }
    });

    return {
      cssRules,
      html: document.body.innerHTML,
      semanticColors,
    };
  });
}

/** Scrapes structured component patterns from a rendered Puppeteer page. */
async function scrapeComponents(page: Page): Promise<ComponentToken[]> {
  const componentTokens = await page.evaluate(() => {
    const components: Array<{
      name: string;
      variants: Array<{ name: string; description: string; states: string[] }>;
      notes: string | null;
    }> = [];

    // BUTTONS
    const buttons = document.querySelectorAll('button, [role="button"], a[class*="btn"], a[class*="button"]');
    if (buttons.length > 0) {
      const variants: Array<{ name: string; description: string; states: string[] }> = [];
      const classes = Array.from(buttons)
        .map((b) => b.className.toString().toLowerCase())
        .join(" ");

      const defaultStates = ["default", "hover", "focus", "active", "disabled"];

      if (classes.includes("primary") || buttons.length > 0)
        variants.push({ name: "primary", description: "Main call-to-action", states: defaultStates });
      if (classes.includes("secondary") || classes.includes("outline"))
        variants.push({ name: "secondary", description: "Secondary action, outline style", states: defaultStates });
      if (classes.includes("ghost") || classes.includes("text"))
        variants.push({ name: "ghost", description: "Minimal emphasis action", states: defaultStates });
      if (classes.includes("danger") || classes.includes("destructive"))
        variants.push({ name: "danger", description: "Destructive or irreversible action", states: defaultStates });
      if (classes.includes("sm") || classes.includes("small"))
        variants.push({ name: "small", description: "Compact button for tight layouts", states: defaultStates });

      if (variants.length === 0)
        variants.push({ name: "primary", description: "Main call-to-action", states: defaultStates });

      components.push({
        name: "Button",
        variants,
        notes: `${buttons.length} button instances detected on page`,
      });
    }

    // NAVIGATION
    const nav = document.querySelector('nav, [role="navigation"], header');
    if (nav) {
      components.push({
        name: "Navigation",
        variants: [
          {
            name: "primary-nav",
            description: "Main site navigation with " + nav.querySelectorAll("a").length + " links",
            states: ["default", "active", "mobile-collapsed"],
          },
          ...(nav.querySelector("[aria-expanded], [aria-haspopup]")
            ? [
                {
                  name: "dropdown",
                  description: "Expandable navigation group",
                  states: ["closed", "open", "hover"],
                },
              ]
            : []),
        ],
        notes: nav.querySelector("[aria-expanded]") ? "Has dropdown menus" : null,
      });
    }

    // CARDS
    const cards = document.querySelectorAll('[class*="card"], [class*="panel"], [class*="tile"]');
    if (cards.length > 0) {
      const cardClasses = Array.from(cards)
        .map((c) => c.className.toString().toLowerCase())
        .join(" ");
      components.push({
        name: "Card",
        variants: [
          { name: "default", description: "Standard content container", states: ["default", "hover"] },
          ...(cardClasses.includes("featured") || cardClasses.includes("highlight")
            ? [
                {
                  name: "featured",
                  description: "Emphasized card with distinct background",
                  states: ["default"],
                },
              ]
            : []),
          ...(cardClasses.includes("interactive") || cardClasses.includes("clickable")
            ? [
                {
                  name: "interactive",
                  description: "Clickable card with hover state",
                  states: ["default", "hover", "active"],
                },
              ]
            : []),
        ],
        notes: cards.length + " card instances detected",
      });
    }

    // FORMS
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    if (inputs.length > 0) {
      const types = Array.from(
        new Set(Array.from(inputs).map((i) => i.getAttribute("type") || i.tagName.toLowerCase()))
      );
      components.push({
        name: "Input",
        variants: types.map((type) => ({
          name: type,
          description: type + " input field",
          states: ["default", "focus", "error", "disabled"],
        })),
        notes: inputs.length + " input fields detected",
      });
    }

    // BADGES
    const badges = document.querySelectorAll('[class*="badge"], [class*="tag"], [class*="chip"], [class*="pill"]');
    if (badges.length > 0) {
      components.push({
        name: "Badge",
        variants: [
          { name: "default", description: "Inline label or status indicator", states: ["default"] },
          { name: "pill", description: "Rounded pill variant", states: ["default"] },
        ],
        notes: badges.length + " badge instances detected",
      });
    }

    return components;
  });

  return componentTokens;
}

/** Extracts behavioral and structural signals from a rendered Puppeteer page. */
async function analyzeDesignPatterns(page: Page): Promise<string> {
  const allPatterns = await page.evaluate(() => {
    const ctaAnalysis = (() => {
      const filled = document.querySelectorAll(
        'button:not([variant="outline"]):not([variant="ghost"]), [class*="btn-primary"], [class*="button-primary"]'
      ).length;
      const outlined = document.querySelectorAll(
        '[class*="btn-outline"], [class*="button-outline"], [class*="btn-secondary"]'
      ).length;
      const links = document.querySelectorAll('a[class*="btn"], a[class*="button"]').length;
      const total = document.querySelectorAll('button, [role="button"]').length;
      return {
        filled,
        outlined,
        links,
        total,
        strategy: filled <= 2 ? "sparse-single-hierarchy" : filled <= 5 ? "moderate" : "dense-multi-cta",
      };
    })();

    const layoutAnalysis = (() => {
      const textNodes = document.querySelectorAll("p, li, td, span").length;
      const containerWidth = document.querySelector('main, [class*="container"], [class*="wrapper"]');
      const maxWidth = containerWidth ? window.getComputedStyle(containerWidth).maxWidth : "unknown";
      const sections = document.querySelectorAll('section, [class*="section"]').length;
      return {
        textNodes,
        maxWidth,
        sections,
        density: textNodes > 200 ? "high" : textNodes > 80 ? "medium" : "low",
      };
    })();

    const componentAnalysis = (() => {
      const tables = document.querySelectorAll('table, [class*="table"]').length;
      const cards = document.querySelectorAll('[class*="card"], [class*="panel"]').length;
      const forms = document.querySelectorAll("form").length;
      const charts = document.querySelectorAll('[class*="chart"], [class*="graph"], canvas').length;
      const modals = document.querySelectorAll('[role="dialog"], [class*="modal"]').length;
      const tabs = document.querySelectorAll('[role="tab"], [class*="tab"]').length;
      const accordions = document.querySelectorAll('[class*="accordion"], details').length;

      const counts = { tables, cards, forms, charts, modals, tabs, accordions };
      const dominant = Object.entries(counts).reduce((a, b) => (a[1] > b[1] ? a : b));

      return {
        ...counts,
        dominantComponent: dominant[1] > 0 ? dominant[0] : "none",
      };
    })();

    const spacingAnalysis = (() => {
      const sections = Array.from(document.querySelectorAll('section, [class*="section"]'));
      const paddings = sections
        .map((s) => {
          const style = window.getComputedStyle(s);
          return parseInt(style.paddingTop || "0", 10);
        })
        .filter((p) => p > 0);
      const avgPadding = paddings.length ? paddings.reduce((a, b) => a + b, 0) / paddings.length : 0;
      return {
        avgSectionPadding: Math.round(avgPadding),
        philosophy: avgPadding > 80 ? "generous-whitespace" : avgPadding > 40 ? "balanced" : "dense-compact",
      };
    })();

    const navAnalysis = (() => {
      const nav = document.querySelector("nav, header");
      if (!nav) return { style: "unknown" };
      const linkCount = nav.querySelectorAll("a").length;
      return {
        linkCount,
        hasDropdowns: !!nav.querySelector("[aria-haspopup]"),
        hasCTA: !!nav.querySelector("button"),
        style: linkCount > 8 ? "mega-nav" : linkCount > 4 ? "standard" : "minimal",
      };
    })();

    const avoidanceSignals = (() => {
      const allElements = document.querySelectorAll("*");
      let heavyShadows = 0;

      allElements.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.boxShadow && style.boxShadow.includes("px") && !style.boxShadow.includes("0px 0px")) {
          heavyShadows++;
        }
      });

      const ctasPerSection = document.querySelectorAll('section button, section [role="button"]');
      const competingCtas = ctasPerSection.length > 3 ? 1 : 0;

      return {
        avoidsHeavyShadows: heavyShadows < 3,
        avoidsCompetingCtas: competingCtas === 0,
        avoidanceList: [
          heavyShadows < 3 ? "heavy drop shadows" : null,
          competingCtas === 0 ? "multiple competing CTAs per section" : null,
        ].filter(Boolean),
      };
    })();

    return { ctaAnalysis, layoutAnalysis, componentAnalysis, spacingAnalysis, navAnalysis, avoidanceSignals };
  });
  const { ctaAnalysis, layoutAnalysis, componentAnalysis, spacingAnalysis, navAnalysis, avoidanceSignals } = allPatterns;

  return `
## BEHAVIORAL DESIGN INTELLIGENCE

### CTA Strategy
${JSON.stringify(ctaAnalysis, null, 2)}

### Layout Density  
${JSON.stringify(layoutAnalysis, null, 2)}

### Component Dominance
${JSON.stringify(componentAnalysis, null, 2)}

### Whitespace Philosophy
${JSON.stringify(spacingAnalysis, null, 2)}

### Navigation Structure
${JSON.stringify(navAnalysis, null, 2)}

### What This System Avoids
${JSON.stringify(avoidanceSignals, null, 2)}
`;
}

/** Uses multiple strategies to detect fonts loaded by the page. */
async function detectFonts(page: Page): Promise<string> {
  // STRATEGY 1 — Read font-face declarations from stylesheets:
  const fontData = await page.evaluate(() => {
    const fonts: string[] = [];
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules).forEach((rule) => {
          if (rule instanceof CSSFontFaceRule) {
            const family = rule.style.getPropertyValue("font-family");
            const src = rule.style.getPropertyValue("src");
            if (family) fonts.push(`font-face: ${family.replace(/['"]/g, "")} | src: ${src.slice(0, 100)}`);
          }
        });
      } catch (e) {
        // Ignore cross-origin stylesheet errors
      }
    });

    const targets = [
      { selector: "h1", role: "display" },
      { selector: "h2", role: "heading" },
      { selector: "p, li", role: "body" },
      { selector: 'button, [role="button"]', role: "button" },
      { selector: "input", role: "input" },
      { selector: "code, pre", role: "mono" },
      { selector: "nav a", role: "nav" },
    ];

    const computedFonts = targets
      .map(({ selector, role }) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const family = window.getComputedStyle(el).fontFamily;
        return { role, family: family.split(",")[0].replace(/['"]/g, "").trim() };
      })
      .filter((f): f is { role: string; family: string } => f !== null);

    return { fontFaces: fonts, computedFonts };
  });
  const { fontFaces, computedFonts } = fontData;

  // STRATEGY 3 — Check for known font loading patterns in page source:
  const pageSource = await page.content();
  const knownFonts = [
    "Inter", "Söhne", "Sohne", "GT Walsheim", "Graphik",
    "Circular", "DM Sans", "Plus Jakarta Sans", "Helvetica Neue",
    "SF Pro", "Geist", "Manrope", "Satoshi", "Cabinet Grotesk",
    "Neue Haas", "Aktiv Grotesk", "Proxima Nova", "Futura",
    "Founders Grotesk", "Canela", "Tiempos", "Freight",
  ];
  const detectedInSource = knownFonts.filter((font) => pageSource.toLowerCase().includes(font.toLowerCase()));

  return `
## FONT DETECTION REPORT

### @font-face Declarations (highest priority - ground truth)
${fontFaces.length > 0 ? fontFaces.join("\\n") : "None found"}

### Computed Font Families by Element Role
${computedFonts.map((f) => `${f.role}: ${f.family}`).join("\\n")}

### Known Fonts Detected in Page Source
${detectedInSource.length > 0 ? detectedInSource.join(", ") : "None detected"}

### Font Priority Decision
${
    fontFaces.length > 0
      ? "USE @font-face family names — these are the actual loaded fonts"
      : detectedInSource.length > 0
      ? "USE source-detected fonts — found in page HTML/JS"
      : "USE computed fonts — fallback detection only"
  }
`;
}

/** Calls AI twice to extract CSS/HTML and screenshot-derived design tokens. */
async function callClaudeForTokens(
  css: string,
  html: string,
  screenshot: string,
  behavioralData: string
): Promise<DesignTokens> {
  try {
    const urlPrompt = buildUrlAnalysisPrompt({ scrapedCSS: css, scrapedHTML: html, behavioralData });
    const imagePrompt = buildImageAnalysisPrompt({ mimeType: "image/png" });
    const customPropertyNote =
      "If you cannot find explicit font-size or font-family values, " +
      "look for CSS custom properties (--font-*, --text-*, --type-*) " +
      "and resolve them to their values if defined in the provided CSS.";
    const [cssResult, visionResult] = await Promise.allSettled([
      aiClient({
        system: urlPrompt.system,
        maxTokens: 4096,
        messages: [{ role: "user", content: `${urlPrompt.user}\n\n${customPropertyNote}` }],
      }),
      aiClient({
        system: imagePrompt.system,
        maxTokens: 2048,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/png;base64,${screenshot}` } },
            { type: "text", text: imagePrompt.user },
          ],
        }],
      }),
    ]);
    const cssOutcome = getSettledTokenOutcome(cssResult, "css");
    const visionOutcome = getSettledTokenOutcome(visionResult, "vision");
    const cssTokens = cssOutcome.tokens;
    const visionTokens = visionOutcome.tokens;

    if (cssTokens !== null && visionTokens !== null) {
      return mergeDesignTokens(cssTokens, visionTokens);
    }

    if (cssTokens !== null) {
      return cssTokens;
    }

    if (visionTokens !== null) {
      return visionTokens;
    }

    console.warn("[url-parser] AI token extraction did not return usable JSON; using deterministic CSS fallback.", {
      css: cssOutcome.warning,
      vision: visionOutcome.warning,
    });

    return buildFallbackUrlTokens(
      css,
      behavioralData,
      [cssOutcome.warning, visionOutcome.warning].filter((warning): warning is string => Boolean(warning))
    );
  } catch (error) {
    if (error instanceof UrlParserError) {
      throw error;
    }

    throw new UrlParserError("AI token extraction failed for this URL.", error);
  }
}

/** Converts a settled AI response into tokens when valid and keeps a useful diagnostic when not. */
function getSettledTokenOutcome(
  result: PromiseSettledResult<string>,
  label: "css" | "vision"
): { tokens: DesignTokens | null; warning: string | null } {
  if (result.status !== "fulfilled") {
    return {
      tokens: null,
      warning: `${label} token call rejected: ${getErrorMessage(result.reason)}`,
    };
  }

  try {
    return {
      tokens: assertDesignTokens(parseClaudeJson(result.value)),
      warning: null,
    };
  } catch (error) {
    return {
      tokens: null,
      warning: `${label} token call returned invalid JSON: ${getErrorMessage(error)}; first 240 chars: ${result.value.slice(0, 240)}`,
    };
  }
}

/** Builds usable URL tokens from deterministic scrape signals when AI JSON extraction fails. */
function buildFallbackUrlTokens(css: string, behavioralData: string, warnings: string[]): DesignTokens {
  return {
    colors: extractFallbackColors(css),
    typography: extractFallbackTypography(css, behavioralData),
    spacing: { baseUnit: null, tokens: [] },
    shapes: extractFallbackShapes(css),
    elevation: extractFallbackElevation(css),
    breakpoints: extractFallbackBreakpoints(css),
    motion: extractFallbackMotion(css),
    components: [],
    meta: {
      source: "url",
      extractedAt: "",
      confidence: 0.45,
      warnings: [
        "AI token extraction returned invalid JSON; used deterministic CSS and DOM fallback tokens.",
        ...warnings,
      ],
    },
  };
}

/** Extracts color tokens from the semantic color prelude, falling back to raw hex values. */
function extractFallbackColors(css: string): ColorToken[] {
  const colors: ColorToken[] = [];
  const usedRoles = new Map<string, number>();
  const semanticBlock = css.match(/\/\* SEMANTIC COLORS BY ELEMENT ROLE \*\/([\s\S]*?)(?:\/\* BEHAVIORAL INTELLIGENCE \*\/|\/\* RAW CSS EXTRACT \*\/)/)?.[1] ?? "";
  const semanticLines = semanticBlock.split("\n").map((line) => line.trim()).filter(Boolean);

  semanticLines.forEach((line) => {
    const [rawRole, rawValues] = line.split(":");
    if (!rawRole || !rawValues) return;

    rawValues.match(/#[0-9a-f]{6}/gi)?.forEach((hex) => {
      colors.push(createFallbackColorToken(getNumberedRole(mapSemanticColorRole(rawRole.trim()), usedRoles), hex));
    });
  });

  if (colors.length > 0) {
    return normalizeUrlColorRoles(dedupeBy(colors, (color) => `${color.role}:${color.hex}`));
  }

  return normalizeUrlColorRoles(dedupeBy(css.match(/#[0-9a-f]{6}/gi) ?? [], (hex) => hex.toLowerCase())
    .slice(0, 24)
    .map((hex, index) => createFallbackColorToken(index === 0 ? "primary" : `accent${index + 1}`, hex)));
}

/** Maps DOM semantic color roles to design-token color roles. */
function mapSemanticColorRole(role: string): string {
  if (role.includes("heading")) return "text";
  if (role.includes("body")) return "text2";
  if (role.includes("muted")) return "muted";
  if (role.includes("link")) return "primary";
  if (role.includes("button-bg")) return "primary";
  if (role.includes("nav-bg")) return "surface";
  if (role.includes("footer-bg")) return "surface2";
  if (role.includes("input-bg")) return "surface";
  if (role.includes("card-bg")) return "surface2";
  if (role.includes("badge-bg")) return "accent";
  if (role.includes("border")) return "border";
  if (role.includes("error")) return "error";
  if (role.includes("success")) return "success";

  return role.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "accent";
}

/** Keeps semantic roles unique by adding numbered suffixes after the first use. */
function getNumberedRole(role: string, usedRoles: Map<string, number>): string {
  const count = usedRoles.get(role) ?? 0;
  usedRoles.set(role, count + 1);

  return count === 0 ? role : `${role}${count + 1}`;
}

/** Creates a normalized color token with conservative contrast flags. */
function createFallbackColorToken(role: string, hex: string): ColorToken {
  const normalizedHex = hex.toLowerCase();

  return {
    hex: normalizedHex,
    role,
    wcagAA: hasReadableContrast(normalizedHex, 4.5),
    wcagAAA: hasReadableContrast(normalizedHex, 7),
  };
}

/** Extracts fallback typography roles from the font report and raw CSS. */
function extractFallbackTypography(css: string, behavioralData: string): TypographyToken[] {
  const familiesByRole = new Map<string, string>();
  const computedFontLines = behavioralData.match(/### Computed Font Families by Element Role([\s\S]*?)(?:### Known Fonts|### Font Priority|$)/)?.[1] ?? "";
  const fontSizes = dedupeBy([...css.matchAll(/font-size\s*:\s*([^;}{]+)/gi)].map((match) => match[1].trim()), (size) => size).slice(0, 8);

  computedFontLines.split("\n").forEach((line) => {
    const [rawRole, family] = line.split(":");
    if (rawRole && family) {
      familiesByRole.set(mapTypographyRole(rawRole.trim()), family.trim());
    }
  });

  const roles = Array.from(familiesByRole.keys());
  const fallbackRoles = roles.length > 0 ? roles : ["body-md"];

  return dedupeBy(fallbackRoles, (role) => role).map((role, index) => ({
    fontFamily: familiesByRole.get(role) ?? extractFirstFontFamily(css),
    fontSize: fontSizes[index] ?? null,
    fontWeight: null,
    lineHeight: null,
    letterSpacing: null,
    role: role as TypographyToken["role"],
  }));
}

/** Maps DOM roles to the typography role union used by the app. */
function mapTypographyRole(role: string): TypographyToken["role"] {
  if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(role)) return role as TypographyToken["role"];
  if (role.includes("button") || role.includes("nav") || role.includes("label")) return "label";
  if (role.includes("caption") || role.includes("small")) return "caption";
  if (role.includes("body") || role === "p") return "body-md";

  return "unknown";
}

/** Extracts the first CSS font-family declaration as a last-resort typography hint. */
function extractFirstFontFamily(css: string): string | null {
  return css.match(/font-family\s*:\s*([^;}{]+)/i)?.[1].trim() ?? null;
}

/** Extracts common radius tokens from CSS. */
function extractFallbackShapes(css: string): DesignTokens["shapes"] {
  return dedupeBy([...css.matchAll(/border-radius\s*:\s*([^;}{]+)/gi)].map((match) => match[1].trim()), (value) => value)
    .slice(0, 8)
    .map((value, index) => ({
      name: index === 0 ? "radius" : `radius${index + 1}`,
      value,
      px: parsePx(value),
    }));
}

/** Extracts common shadow tokens from CSS. */
function extractFallbackElevation(css: string): DesignTokens["elevation"] {
  return dedupeBy([...css.matchAll(/box-shadow\s*:\s*([^;}{]+)/gi)].map((match) => match[1].trim()), (value) => value)
    .slice(0, 8)
    .map((value, index) => ({
      name: index === 0 ? "shadow" : `shadow${index + 1}`,
      value,
      isFlat: value === "none",
    }));
}

/** Extracts responsive breakpoint hints from media queries. */
function extractFallbackBreakpoints(css: string): DesignTokens["breakpoints"] {
  return dedupeBy([...css.matchAll(/min-width\s*:\s*([^)]+)/gi)].map((match) => match[1].trim()), (value) => value)
    .slice(0, 8)
    .map((minWidth, index) => ({
      name: index === 0 ? "sm" : `breakpoint${index + 1}`,
      minWidth,
    }));
}

/** Extracts motion timing tokens from transition or animation declarations. */
function extractFallbackMotion(css: string): DesignTokens["motion"] {
  return dedupeBy([...css.matchAll(/(?:transition-duration|animation-duration)\s*:\s*([^;}{]+)/gi)].map((match) => match[1].trim()), (value) => value)
    .slice(0, 8)
    .map((duration, index) => ({
      name: index === 0 ? "duration" : `duration${index + 1}`,
      duration,
      easing: null,
    }));
}

/** Infers a clean spacing scale from raw parsed spacing tokens. */
function inferSpacingScale(tokens: DesignTokens): SpacingScale {
  const spacingValues = tokens.spacing.tokens
    .map((token) => token.px)
    .filter((value): value is number => typeof value === "number" && value > 0 && value <= 64);
  const smallValueCounts = spacingValues
    .filter((value) => value <= 16)
    .reduce<Record<number, number>>((counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    }, {});
  const baseUnit = Number(Object.entries(smallValueCounts)
    .sort((first, second) => {
      const countDifference = second[1] - first[1];
      return countDifference === 0 ? Number(first[0]) - Number(second[0]) : countDifference;
    })[0]?.[0] ?? 8);

  const multipliers = [1, 2, 3, 4, 6, 8];

  const scaleTokens: SpacingToken[] = DEFAULT_SPACING_NAMES.map((name, index) => {
    const px = Math.min(baseUnit * multipliers[index], 64);

    return {
      name,
      value: `${px}px`,
      px,
    };
  });

  return { baseUnit, tokens: scaleTokens };
}

/** Parses AI JSON output and normalizes accidental markdown fences. */
function parseClaudeJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  const json = jsonStart >= 0 && jsonEnd > jsonStart ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;

  try {
    return JSON.parse(json) as unknown;
  } catch (error) {
    throw new UrlParserError("AI returned invalid JSON for URL parsing.", error);
  }
}

/** Merges CSS-derived and vision-derived token results by source strength. */
function mergeDesignTokens(cssTokens: DesignTokens, visionTokens: DesignTokens): DesignTokens {
  return {
    ...cssTokens,
    colors: normalizeUrlColorRoles(dedupeBy([...cssTokens.colors, ...visionTokens.colors], (color) => `${color.role}:${color.hex ?? "null"}`)),
    typography: dedupeBy([...visionTokens.typography, ...cssTokens.typography], (token) => `${token.role}:${token.fontFamily ?? ""}:${token.fontSize ?? ""}`),
    spacing: cssTokens.spacing.tokens.length > 0 ? cssTokens.spacing : visionTokens.spacing,
    shapes: dedupeBy([...cssTokens.shapes, ...visionTokens.shapes], (token) => `${token.name}:${token.value ?? ""}`),
    elevation: dedupeBy([...cssTokens.elevation, ...visionTokens.elevation], (token) => `${token.name}:${token.value ?? ""}`),
    breakpoints: dedupeBy([...cssTokens.breakpoints, ...visionTokens.breakpoints], (token) => `${token.name}:${token.minWidth ?? ""}`),
    motion: dedupeBy([...cssTokens.motion, ...visionTokens.motion], (token) => `${token.name}:${token.duration ?? ""}:${token.easing ?? ""}`),
    components: dedupeBy([...visionTokens.components, ...cssTokens.components], (component) => component.name),
    meta: {
      ...cssTokens.meta,
      warnings: [...getWarnings(cssTokens), ...getWarnings(visionTokens)],
    },
  };
}

/** Normalizes URL color roles so saturated CTA colors beat neutral backgrounds, while monochrome sites stay valid. */
function normalizeUrlColorRoles(colors: unknown): ColorToken[] {
  if (!Array.isArray(colors)) {
    return [];
  }

  const parsed = colors
    .map((color) => getOptionalRecord(color))
    .filter((color): color is Record<string, unknown> => color !== null)
    .map((color) => {
      const hex = typeof color.hex === "string" ? normalizeColorHex(color.hex) : null;
      return {
        hex,
        role: typeof color.role === "string" ? color.role : "unknown",
        wcagAA: typeof color.wcagAA === "boolean" ? color.wcagAA : (hex ? hasReadableContrast(hex, 4.5) : false),
        wcagAAA: typeof color.wcagAAA === "boolean" ? color.wcagAAA : (hex ? hasReadableContrast(hex, 7) : false),
      } satisfies ColorToken;
    })
    .filter((color) => color.hex !== null);

  const saturatedPrimary = parsed.find((color) => isPrimaryLikeRole(color.role) && color.hex && isSaturatedColor(color.hex));
  const saturatedInteractive = saturatedPrimary ?? parsed.find((color) => color.hex && isSaturatedColor(color.hex) && isInteractiveColorRole(color.role));
  const hasSaturatedColor = parsed.some((color) => color.hex && isSaturatedColor(color.hex));

  const normalized = parsed.map((color) => {
    if (!isPrimaryLikeRole(color.role) || color.hex === null || !isNeutralColor(color.hex)) {
      return color;
    }

    if (!hasSaturatedColor) {
      return color;
    }

    return {
      ...color,
      role: color.hex === "#000000" || getRelativeLuminance(color.hex) < 0.08 ? "background" : "text",
    };
  });

  if (!saturatedInteractive?.hex) {
    return normalized;
  }

  let assignedPrimary = false;
  const demotedPrimaryRoles = new Map<string, number>();
  return normalized.map((color) => {
    if (color.hex?.toLowerCase() === saturatedInteractive.hex?.toLowerCase() && !assignedPrimary) {
      assignedPrimary = true;
      return { ...color, role: "primary" };
    }

    if (isPrimaryLikeRole(color.role)) {
      return { ...color, role: getNumberedRole("accent", demotedPrimaryRoles) };
    }

    return color;
  });
}

/** Detects role names that should compete for primary action color. */
function isPrimaryLikeRole(role: string): boolean {
  return /^primary\d*$/i.test(role);
}

/** Detects roles likely sourced from interactive or brand color usage. */
function isInteractiveColorRole(role: string): boolean {
  const normalized = role.toLowerCase();
  return normalized.includes("primary") ||
    normalized.includes("accent") ||
    normalized.includes("brand") ||
    normalized.includes("link") ||
    normalized.includes("button");
}

/** Keeps monochrome palettes intact while identifying black/white/gray neutrals. */
function isNeutralColor(hex: string): boolean {
  const { red, green, blue } = hexToRgb(hex);
  return Math.max(red, green, blue) - Math.min(red, green, blue) <= 18;
}

/** Finds saturated brand/action colors such as Gemini's blue CTA. */
function isSaturatedColor(hex: string): boolean {
  const { red, green, blue } = hexToRgb(hex);
  const max = Math.max(red, green, blue) / 255;
  const min = Math.min(red, green, blue) / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  return saturation >= 0.28 && max >= 0.35;
}

/** Normalizes CSS hex values to uppercase #RRGGBB. */
function normalizeColorHex(hex: string): string | null {
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return hex.toUpperCase();
  }

  if (/^#[0-9a-f]{8}$/i.test(hex)) {
    return hex.slice(0, 7).toUpperCase();
  }

  return null;
}

/** Parses a normalized hex color into RGB channels. */
function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const normalized = normalizeColorHex(hex) ?? "#000000";
  return {
    red: parseInt(normalized.slice(1, 3), 16),
    green: parseInt(normalized.slice(3, 5), 16),
    blue: parseInt(normalized.slice(5, 7), 16),
  };
}

/** Deduplicates an array by a stable string key while preserving first wins. */
function dedupeBy<TItem>(items: TItem[], getKey: (item: TItem) => string): TItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Removes CSS comments and obvious non-rule noise. */
function stripCssNoise(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").trim();
}

/** Converts an rgb/rgba CSS color string to lowercase #rrggbb hex. */
function rgbStringToHex(rgb: string): string {
  if (rgb.startsWith("#")) {
    return rgb.toLowerCase();
  }

  const channels = rgb.match(/\d+(\.\d+)?/g)?.slice(0, 3).map((value) => Number(value)) ?? [];

  if (channels.length < 3 || channels.some((channel) => Number.isNaN(channel))) {
    return rgb.toLowerCase();
  }

  return `#${channels
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Reads parser warnings from partially shaped AI token output. */
function getWarnings(tokens: DesignTokens): string[] {
  return Array.isArray(tokens.meta?.warnings) ? tokens.meta.warnings : [];
}

/** Validates the minimum token shape returned by AI. */
function assertDesignTokens(value: unknown): DesignTokens {
  const record = getRecord(value);

  if (!Array.isArray(record.colors) || !Array.isArray(record.typography)) {
    throw new UrlParserError("AI JSON is missing required token arrays.");
  }

  const spacing = getOptionalRecord(record.spacing);
  const meta = getOptionalRecord(record.meta);
  const warnings = Array.isArray(meta?.warnings)
    ? meta.warnings.filter((warning): warning is string => typeof warning === "string")
    : [];

  return {
    colors: normalizeUrlColorRoles(record.colors),
    typography: record.typography,
    spacing: {
      baseUnit: typeof spacing?.baseUnit === "number" ? spacing.baseUnit : null,
      tokens: Array.isArray(spacing?.tokens) ? spacing.tokens : [],
    },
    shapes: Array.isArray(record.shapes) ? record.shapes : [],
    elevation: Array.isArray(record.elevation) ? record.elevation : [],
    breakpoints: Array.isArray(record.breakpoints) ? record.breakpoints : [],
    motion: Array.isArray(record.motion) ? record.motion : [],
    components: Array.isArray(record.components) ? record.components : [],
    meta: {
      source: "url",
      extractedAt: "",
      confidence: 0,
      warnings,
    },
  } as DesignTokens;
}

/** Narrows an unknown value to a string-keyed record. */
function getRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new UrlParserError("Expected a JSON object.");
  }

  return value as Record<string, unknown>;
}

/** Narrows an optional unknown value to a string-keyed record. */
function getOptionalRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

/** Reads the first px-like value from a CSS value. */
function parsePx(value: string): number | null {
  const px = value.match(/-?\d+(\.\d+)?px/)?.[0].replace("px", "");
  const parsed = px ? Number(px) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

/** Checks whether a color can reach a contrast threshold against black or white. */
function hasReadableContrast(hex: string, threshold: number): boolean {
  return Math.max(getContrastRatio(hex, "#000000"), getContrastRatio(hex, "#ffffff")) >= threshold;
}

/** Computes WCAG contrast ratio between two hex colors. */
function getContrastRatio(firstHex: string, secondHex: string): number {
  const first = getRelativeLuminance(firstHex);
  const second = getRelativeLuminance(secondHex);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

/** Computes relative luminance for a normalized #rrggbb color. */
function getRelativeLuminance(hex: string): number {
  const match = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return 0;

  const channels = [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16) / 255);
  const linearChannels = channels.map((channel) => (
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));

  return 0.2126 * linearChannels[0] + 0.7152 * linearChannels[1] + 0.0722 * linearChannels[2];
}

/** Formats unknown errors for parser diagnostics. */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
