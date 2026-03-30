import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '../../__tests__/test-utils';
import FolderList from '../FolderList';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Helper to generate folders
const generateFolders = (count, prefix = 'Folder') => {
  const folders = [];
  for (let i = 1; i <= count; i++) {
    folders.push({ id: `${prefix.toLowerCase()}-${i}`, name: `${prefix} ${i}` });
  }
  return folders;
};

// Data for testing
const testFolders = [
  ...generateFolders(10, 'Top'),
  { id: 'target-1', name: 'Important Folder A' },
  { id: 'target-2', name: 'Important Folder B' },
  ...generateFolders(10, 'Bottom')
];

const initialState = {
  auth: { isAuthorized: true },
  drive: {
    folders: testFolders,
    isLoadingFolders: false,
    selectedFolderId: null,
    currentParentId: 'root',
    parentHistory: [],
    searchResults: [],
    isSearchingFolders: false,
  }
};

describe('FolderList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for getFolders to return our test data
    window.electronAPI.getFolders.mockResolvedValue({ folders: testFolders, nextPageToken: null });
  });

  it('renders a list of folders', async () => {
    render(<FolderList />, { preloadedState: initialState });

    // Use findBy to handle the initial fetch lifecycle
    expect(await screen.findByText('Important Folder A')).toBeDefined();
    expect(await screen.findByText('Important Folder B')).toBeDefined();
    expect(screen.getByText('Folders')).toBeDefined();
    expect(screen.getByText('Top 1')).toBeDefined();
  });

  it('highlights the selected folder and calls scrollIntoView', async () => {
    const selectedState = {
      ...initialState,
      drive: { ...initialState.drive, selectedFolderId: 'target-1' }
    };
    
    render(<FolderList />, { preloadedState: selectedState });

    const folderItem = (await screen.findByText('Important Folder A')).closest('li');
    expect(folderItem.className).toContain('text-blue-600');

    // Wait for the useEffect with timeout to trigger scrollIntoView
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        block: 'center',
        behavior: 'smooth'
      });
    }, { timeout: 1000 });
  });

  it('shows the search bar when the search button is clicked', async () => {
    render(<FolderList />, { preloadedState: initialState });

    const searchButton = screen.getByTitle('Search folders');
    fireEvent.click(searchButton);

    expect(await screen.findByPlaceholderText('Search folders...')).toBeDefined();
  });

  it('filters folders as the user types in search', async () => {
    render(<FolderList />, { preloadedState: initialState });

    // Open search
    fireEvent.click(screen.getByTitle('Search folders'));

    const searchInput = await screen.findByPlaceholderText('Search folders...');
    fireEvent.change(searchInput, { target: { value: 'Important' } });

    // Check if dropdown results appear
    // We target the search container specifically to avoid matching the main list
    const searchContainer = searchInput.parentElement;
    await waitFor(() => {
      const results = within(searchContainer).getByText((content, element) => {
        const hasText = (node) => node.textContent === 'Important Folder A';
        const nodeHasText = hasText(element);
        const childrenDontHaveText = Array.from(element.children).every(
          child => !hasText(child)
        );
        return nodeHasText && childrenDontHaveText;
      });
      expect(results).toBeDefined();
    });
  });

  it('shows "Go Up" button when there is parent history', async () => {
    const stateWithHistory = {
      ...initialState,
      drive: { ...initialState.drive, parentHistory: ['root'], currentParentId: '1' }
    };
    render(<FolderList />, { preloadedState: stateWithHistory });

    expect(await screen.findByTitle('Go Up')).toBeDefined();
  });

  it('renders a spinner when loading', async () => {
    const loadingState = {
      ...initialState,
      drive: { ...initialState.drive, isLoadingFolders: true, folders: [] }
    };
    render(<FolderList />, { preloadedState: loadingState });

    // Check for spinner
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeDefined();
    });
  });

  it('renders empty message when no folders are found', async () => {
    // Mock getFolders to return empty for this test
    window.electronAPI.getFolders.mockResolvedValue({ folders: [], nextPageToken: null });

    const emptyState = {
      ...initialState,
      drive: { ...initialState.drive, folders: [] }
    };
    render(<FolderList />, { preloadedState: emptyState });

    expect(await screen.findByText('No folders found in this directory')).toBeDefined();
  });
});
