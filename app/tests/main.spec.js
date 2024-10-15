const { test, expect, _electron: electron } = require('@playwright/test');

test('launch app and check for authorize text', async () => {
  const electronApp = await electron.launch({ args: ['main.js'] });
  
  const window = await electronApp.firstWindow();

  const locator = window.locator('#authorize');

  await expect(locator).toHaveText('authorize');

  await electronApp.close();
});
