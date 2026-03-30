import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectFolder, setCurrentParentId, pushParentHistory, popParentHistory, fetchFolders, setSearchResults } from '../store/driveSlice';
import { Spinner } from './common/Spinner';
import LevelUpIcon from '../../../assets/level-up-alt.svg?react';
import FolderIcon from '../../../assets/folder.svg?react';

function FolderList() {
  const dispatch = useDispatch();
  const folders = useSelector(state => state.drive.folders);
  const isLoading = useSelector(state => state.drive.isLoadingFolders);
  const selectedFolderId = useSelector(state => state.drive.selectedFolderId);
  const isAuthorized = useSelector(state => state.auth.isAuthorized);
  // Removed folderCache as per user request to stick to current directory

  const currentParentId = useSelector(state => state.drive.currentParentId);
  const parentHistory = useSelector(state => state.drive.parentHistory);
  const nextFoldersPageToken = useSelector(state => state.drive.nextFoldersPageToken);
  const refreshTrigger = useSelector(state => state.drive.refreshTrigger);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchResults = useSelector(state => state.drive.searchResults);
  const isSearching = useSelector(state => state.drive.isSearchingFolders);
  const dropdownRef = useRef(null);
  const [scrollRequestTimestamp, setScrollRequestTimestamp] = useState(0);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Direct filtering of current directory folders
      const filtered = folders.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      dispatch(setSearchResults({ folders: filtered }));
      setShowSearchDropdown(true);
    } else {
      dispatch(setSearchResults({ folders: [] }));
      setShowSearchDropdown(false);
    }
  }, [searchQuery, folders, dispatch]);

  // Auto-scroll to selected folder
  useEffect(() => {
    if (selectedFolderId) {
      // Small timeout ensures the DOM has updated and search dropdown has closed
      const timer = setTimeout(() => {
        const element = document.getElementById(`folder-${selectedFolderId}`);
        if (element) {
          element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedFolderId, scrollRequestTimestamp]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedSearchResults = [...searchResults].sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    const qLower = searchQuery.toLowerCase();
    if (aLower === qLower) return -1;
    if (bLower === qLower) return 1;
    if (aLower.startsWith(qLower) && !bLower.startsWith(qLower)) return -1;
    if (bLower.startsWith(qLower) && !aLower.startsWith(qLower)) return 1;
    return aLower.localeCompare(bLower);
  });

  const renderHighlightedName = (name, query) => {
    if (!query) return <span>{name}</span>;
    const parts = name.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span className="truncate" title={name}>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={`match-${i}`} className="text-blue-600 dark:text-blue-400 font-bold underline decoration-blue-200 dark:decoration-blue-800">{part}</span> 
            : <span key={`text-${i}`}>{part}</span>
        )}
      </span>
    );
  };

  useEffect(() => {
    if (isAuthorized) {
      dispatch(fetchFolders({ parentId: currentParentId }));
    }
  }, [isAuthorized, currentParentId, refreshTrigger, dispatch]);

  const handleFolderClick = (folder) => {
    dispatch(selectFolder(folder));
  };

  const handleDoubleClick = (folder) => {
      // Navigate into the folder
      dispatch(pushParentHistory(currentParentId));
      dispatch(setCurrentParentId(folder.id));
      dispatch(selectFolder({id: null})); // Clear selection when navigating
  };

  const handleUpDirectory = () => {
      dispatch(popParentHistory());
      dispatch(selectFolder({id: null}));
  };

  return (
    <div className="block bg-white rounded-lg shadow-sm dark:bg-gray-800 divide-y flex flex-col max-h-full h-fit">
      <div className="flex justify-between items-center px-6 py-2 bg-gray-50 dark:bg-gray-700">
        <p className="text-gray-900 dark:text-white">Folders</p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-1 rounded-md transition-colors focus:outline-none ${
              isSearchOpen 
                ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-gray-600' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-600'
            }`}
            title="Search folders"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {parentHistory.length > 0 && (
             <button
               onClick={handleUpDirectory}
               className="px-2 py-1 text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white flex items-center justify-center min-w-[32px] min-h-[28px]"
               title="Go Up"
             >
               <LevelUpIcon className="w-4 h-4" aria-label="Go Up" />
             </button>
          )}
        </div>
      </div>
      {isSearchOpen && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 relative">
          <input
            type="text"
            placeholder="Search folders..."
            autoFocus
            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
          />
          {showSearchDropdown && (
            <div 
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {isSearching ? (
                <div className="p-4 flex justify-center"><Spinner className="h-5 w-5 text-blue-500" /></div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">No matches found</div>
              ) : (
                <ul>
                {sortedSearchResults.map(folder => (
                  <li 
                    key={folder.id}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        dispatch(selectFolder(folder));
                        setScrollRequestTimestamp(Date.now());
                        setSearchQuery('');
                        setShowSearchDropdown(false);
                        setIsSearchOpen(false);
                      }
                    }}
                    onClick={() => {
                      dispatch(selectFolder(folder));
                      setScrollRequestTimestamp(Date.now());
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                      setIsSearchOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-700 last:border-0 flex items-center outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    <FolderIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {renderHighlightedName(folder.name, searchQuery)}
                  </li>
                ))}
              </ul>
              )}
            </div>
          )}
        </div>
      )}
      <ul id="folder-list" className="overflow-y-auto select-none max-h-[calc(100vh-240px)] flex-1">
        {isLoading && folders.length === 0 ? (
           <li className="p-4 flex justify-center items-center">
             <Spinner className="h-8 w-8 text-blue-500" />
           </li>
        ) : folders.length === 0 ? (
           <li className="p-4 text-center text-gray-500">No folders found in this directory</li>
        ) : (
          <>
            {folders.map((folder) => (
              <li
                key={folder.id}
                id={`folder-${folder.id}`}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFolderClick(folder);
                  }
                }}
                onClick={() => handleFolderClick(folder)}
                onDoubleClick={() => handleDoubleClick(folder)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
                  selectedFolderId === folder.id ? 'bg-blue-50 dark:bg-gray-700 font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FolderIcon className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" aria-label="Folder" />
                  <span className="truncate" title={folder.name}>{folder.name}</span>
                </div>
              </li>
            ))}
            {nextFoldersPageToken && (
               <li
                 tabIndex={0}
                 role="button"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     dispatch(fetchFolders({ parentId: currentParentId, pageToken: nextFoldersPageToken, append: true }));
                   }
                 }}
                 onClick={() => dispatch(fetchFolders({ parentId: currentParentId, pageToken: nextFoldersPageToken, append: true }))}
                 className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-center text-blue-500 text-sm outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
               >
                 {isLoading ? 'Loading more...' : 'Load more folders'}
               </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
}

export default FolderList;
