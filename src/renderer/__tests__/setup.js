import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron API
globalThis.electronAPI = {
  getFolders: vi.fn().mockResolvedValue({ folders: [], nextPageToken: null }),
  getFiles: vi.fn().mockResolvedValue({ files: [], nextPageToken: null }),
  searchFolders: vi.fn().mockResolvedValue({ folders: [], nextPageToken: null }),
  openExternal: vi.fn().mockResolvedValue({ success: true }),
  showItemInFolder: vi.fn().mockResolvedValue({ success: true }),
  downloadFile: vi.fn().mockResolvedValue({ success: true }),
  deleteFile: vi.fn().mockResolvedValue({ success: true }),
  renameFile: vi.fn().mockResolvedValue({ success: true }),
  createFolder: vi.fn().mockResolvedValue({ success: true }),
  onDownloadProgress: vi.fn(),
  onDownloadComplete: vi.fn(),
  onDownloadError: vi.fn(),
  removeDownloadListeners: vi.fn(),
};

// Mock ScrollIntoView as it's not implemented in JSDOM
Element.prototype.scrollIntoView = vi.fn();
