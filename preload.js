/**
 * The preload script runs before the renderer process is loaded.
 * It has access to web APIs as well as Electron's renderer process modules
 * and some polyfilled Node.js functions.
 *
 * This script is used to securely expose specific Node.js functionalities
 * to the renderer process, following Electron's security best practices
 * when contextIsolation is enabled (though it's currently disabled in this project).
 *
 * See: https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { ipcRenderer } = require('electron');

// Expose a limited set of IPC functions to the renderer process.
// This is a secure way to allow communication between the main and renderer processes.
window.electronAPI = {
  /**
   * Invokes the 'get-user-data-path' IPC handler in the main process.
   * @returns {Promise<string>} A promise that resolves with the application's user data path.
   */
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
};

// This event listener runs once the DOM is fully loaded.
window.addEventListener('DOMContentLoaded', () => {
  /**
   * A helper function to find an element by its ID and replace its text content.
   * @param {string} selector - The ID of the DOM element.
   * @param {string} text - The text to set for the element.
   */
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  // Display the versions of Chrome, Node, and Electron in the UI.
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
