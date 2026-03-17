import React from 'react';

function TitleBar() {
  const handleMinimize = () => {
    ((window as any).electronAPI as any)?.minimizeWindow();
  };

  const handleMaximize = () => {
    ((window as any).electronAPI as any)?.maximizeWindow();
  };

  const handleClose = () => {
    ((window as any).electronAPI as any)?.closeWindow();
  };

  const handleMenuClick = (menuLabel: string, e: React.MouseEvent<HTMLDivElement>) => {
      // In a real implementation, you'd calculate exact x/y or just let main process handle it via a custom event
      // This is a simplified version of the native context menu approach
      const rect = e.currentTarget.getBoundingClientRect();
      ((window as any).electronAPI as any)?.showSubmenu(menuLabel, Math.round(rect.left), Math.round(rect.bottom));
  };

  return (
    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-8 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center px-2">
        <img src="../../assets/icon.png" className="w-4 h-4 mr-2" alt="Icon" />
        <div className="flex text-xs text-gray-700 dark:text-gray-300" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div onClick={(e) => handleMenuClick('File', e)} className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded">File</div>
          <div onClick={(e) => handleMenuClick('View', e)} className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded">View</div>
          <div onClick={(e) => handleMenuClick('Help', e)} className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded">Help</div>
        </div>
      </div>
      <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div onClick={handleMinimize} className="px-4 h-full flex items-center hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
          <i className="fas fa-minus text-xs"></i>
        </div>
        <div onClick={handleMaximize} className="px-4 h-full flex items-center hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
          <i className="far fa-square text-xs"></i>
        </div>
        <div onClick={handleClose} className="px-4 h-full flex items-center hover:bg-red-500 hover:text-white cursor-pointer">
          <i className="fas fa-times text-xs"></i>
        </div>
      </div>
    </div>
  );
}

export default TitleBar;
