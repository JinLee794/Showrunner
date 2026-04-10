import { chromium, type Browser, type BrowserContext } from 'playwright';

/**
 * Manages a warm Playwright browser instance. Reuses a single browser
 * across renders and creates fresh contexts per render for isolation.
 */
export class BrowserPool {
  private browser: Browser | null = null;
  private launching: Promise<Browser> | null = null;

  async acquire(): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    return browser.newContext();
  }

  async release(context: BrowserContext): Promise<void> {
    await context.close();
  }

  isReady(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }
    // Prevent multiple concurrent launches
    if (this.launching) {
      return this.launching;
    }
    this.launching = chromium.launch({
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    this.browser = await this.launching;
    this.launching = null;
    return this.browser;
  }
}
