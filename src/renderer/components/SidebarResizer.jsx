import { useState, useCallback, useEffect, useRef } from 'react';

const SidebarResizer = ({ sidebarWidth, setSidebarWidth }) => {
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startX: 0, startWidth: 0 });

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };
  }, [sidebarWidth]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      // Calculate delta from the initial drag point.
      // Dragging left (negative delta) increases width, dragging right (positive delta) decreases width.
      const delta = resizeRef.current.startX - e.clientX;
      const newWidth = resizeRef.current.startWidth + delta;

      // Constraints:
      // min width 30% of viewport
      const minWidth = window.innerWidth * 0.3;
      // max width 50% of viewport
      const maxWidth = window.innerWidth * 0.5;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      } else if (newWidth < minWidth) {
        setSidebarWidth(minWidth);
      } else if (newWidth > maxWidth) {
        setSidebarWidth(maxWidth);
      }
    }
  }, [isResizing, setSidebarWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div
      className="w-2 cursor-col-resize group transition-colors mx-2 flex justify-center"
      onMouseDown={startResizing}
    >
      <div className="w-px h-full bg-gray-300 group-hover:bg-blue-500 pointer-events-none"></div>
    </div>
  );
};

export default SidebarResizer;
