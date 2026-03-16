import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearAllSelections, setFiles } from '../store/driveSlice';
import { addNotification, setSlicePreview, setOperationPreview } from '../store/uiSlice';
import Toastify from 'toastify-js';

function ExecuteSidebar() {
  const dispatch = useDispatch();
  const selectedFileIds = useSelector(state => state.drive.selectedFileIds);
  const files = useSelector(state => state.drive.files);
  const [operation, setOperation] = useState(''); // 'replace', 'slice', 'pad'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form states
  const [replaceTarget, setReplaceTarget] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [sliceStart, setSliceStart] = useState(0);
  const [sliceEnd, setSliceEnd] = useState(0);
  const [padPosition, setPadPosition] = useState('start');
  const [padCount, setPadCount] = useState('');
  const [padChar, setPadChar] = useState('');

  const [isExecuting, setIsExecuting] = useState(false);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const selectOperation = (op) => {
    setOperation(op);
    setIsDropdownOpen(false);
    if (op !== 'slice') dispatch(setSlicePreview({ active: false }));
  };

  // Sync operation state to Redux so FileList can preview changes
  useEffect(() => {
    if (operation) {
      let params = {};
      if (operation === 'replace') {
        params = { search: replaceTarget, replace: replaceWith };
      } else if (operation === 'slice') {
        params = { start: sliceStart, end: sliceEnd || undefined };
      } else if (operation === 'pad') {
        params = { position: padPosition, count: parseInt(padCount, 10), char: padChar };
      }
      dispatch(setOperationPreview({ active: true, type: operation, params }));
    } else {
      dispatch(setOperationPreview({ active: false, type: '', params: {} }));
    }
  }, [operation, replaceTarget, replaceWith, sliceStart, sliceEnd, padPosition, padCount, padChar, dispatch]);

  // Sync slice indices to Redux so FileList can show position cursors
  useEffect(() => {
    if (operation === 'slice') {
      dispatch(setSlicePreview({ active: true, start: sliceStart, end: sliceEnd }));
    }
  }, [operation, sliceStart, sliceEnd, dispatch]);

  const nextFilesPageToken = useSelector(state => state.drive.nextFilesPageToken);

  const handleExecute = async () => {
    if (!window.electronAPI) return;

    const targetFiles = files.filter(f => selectedFileIds.includes(f.id));
    if (targetFiles.length === 0) return;

    let params = {};
    if (operation === 'replace') {
      if (!replaceTarget) return;
      params = { search: replaceTarget, replace: replaceWith };
    } else if (operation === 'slice') {
      params = { start: sliceStart, end: sliceEnd || undefined };
    } else if (operation === 'pad') {
      if (!padCount || !padChar) return;
      params = { position: padPosition, count: parseInt(padCount, 10), char: padChar };
    } else {
      return;
    }

    setIsExecuting(true);
    try {
      const updatedFiles = await window.electronAPI.executeOperation(operation, params, targetFiles);

      if (updatedFiles && updatedFiles.error) {
          const errorMsg = `Execution failed: ${updatedFiles.error}`;
          if (updatedFiles.errorCode === 'ETIMEDOUT' || updatedFiles.errorCode === 'NETWORK_ERROR') {
              Toastify({
                  text: errorMsg,
                  duration: 5000,
                  close: true,
                  gravity: "bottom",
                  position: "right",
                  style: {
                      background: "#EF4444",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      maxWidth: "300px",
                      fontSize: "14px",
                      padding: "10px 15px",
                      overflowX: "auto",
                      whiteSpace: "nowrap"
                  }
              }).showToast();
          } else {
              dispatch(addNotification({ message: errorMsg, type: "error" }));
          }
          return;
      }

      // Update local state with new file names
      if (updatedFiles && Array.isArray(updatedFiles)) {
         const newFiles = files.map(f => {
             const updated = updatedFiles.find(uf => uf.id === f.id);
             return updated ? { ...f, name: updated.newName } : f;
         });
         dispatch(setFiles({ files: newFiles, nextPageToken: nextFilesPageToken }));
         dispatch(clearAllSelections());
      }
    } catch (error) {
      console.error("Execution error:", error);
      const errorMsg = `Execution failed: ${error.message || error}`;
      dispatch(addNotification({ message: errorMsg, type: "error" }));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="block p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white select-none">Execute Menu</h5>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Target: {selectedFileIds.length} file(s)
      </p>

      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white select-none">Select Operation</label>

      <div className="relative mb-4">
        <button
          onClick={toggleDropdown}
          className="text-gray-900 bg-gray-50 border border-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center justify-between w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-800 select-none"
          type="button"
        >
          {operation === 'replace' ? 'Replace Text' :
           operation === 'slice' ? 'Slice Text' :
           operation === 'pad' ? 'Pad Filename' : 'Choose an operation'}
          <svg className="w-2.5 h-2.5 ms-3" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-full dark:bg-gray-700 absolute top-full mt-1 border border-gray-200 dark:border-gray-600">
            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200 select-none">
              <li>
                <button onClick={() => selectOperation('replace')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Replace Text</button>
              </li>
              <li>
                <button onClick={() => selectOperation('slice')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Slice Text</button>
              </li>
              <li>
                <button onClick={() => selectOperation('pad')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Pad Filename</button>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {operation === 'replace' && (
          <>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Target text</label>
              <input type="text" value={replaceTarget} onChange={e => setReplaceTarget(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Replace with</label>
              <input type="text" value={replaceWith} onChange={e => setReplaceWith(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            </div>
          </>
        )}

        {operation === 'slice' && (() => {
          const targetFiles = files.filter(f => selectedFileIds.includes(f.id));
          const maxSliceLength = targetFiles.length > 0
            ? Math.max(...targetFiles.map(f => f.name.length), 1)
            : 100;
          const handleSliceStart = (e) => {
            const v = parseInt(e.target.value, 10);
            setSliceStart(v);
            if (v > sliceEnd) setSliceEnd(v);
          };
          const handleSliceEnd = (e) => {
            const v = parseInt(e.target.value, 10);
            setSliceEnd(v);
            if (v < sliceStart) setSliceStart(v);
          };
          return (
            <>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start index</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={maxSliceLength}
                    value={sliceStart}
                    onChange={handleSliceStart}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 tabular-nums">{sliceStart}</span>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End index (optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={maxSliceLength}
                    value={sliceEnd}
                    onChange={handleSliceEnd}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 tabular-nums">{sliceEnd}</span>
                </div>
              </div>
            </>
          );
        })()}

        {operation === 'pad' && (
          <>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Position</label>
              <select value={padPosition} onChange={e => setPadPosition(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                <option value="start">Start (Left)</option>
                <option value="end">End (Right)</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Count</label>
              <input type="number" value={padCount} onChange={e => setPadCount(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required min="1" />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Character</label>
              <input type="text" value={padChar} onChange={e => setPadChar(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required maxLength="1" />
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleExecute}
        disabled={!operation || isExecuting}
        type="button"
        className="w-full mt-6 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
      >
        {isExecuting ? 'EXECUTING...' : 'RUN OPERATION'}
      </button>
    </div>
  );
}

export default ExecuteSidebar;