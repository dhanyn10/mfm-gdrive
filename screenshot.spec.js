const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');

test('Generate screenshots', async () => {
  // Launch the application
  const electronApp = await electron.launch({ args: ['main.js'] });

  // Wait for the main window to open
  const window = await electronApp.firstWindow();
  await window.waitForSelector('#authorize');

  // Take a screenshot of the authorization screen
  await window.screenshot({ path: 'screenshot-authorize.png', fullPage: true });

  // Close the application
  await electronApp.close();
});
