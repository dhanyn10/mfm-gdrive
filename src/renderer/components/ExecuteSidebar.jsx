/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearAllSelections, setFiles } from '../store/driveSlice';
import { addNotification } from '../store/uiSlice';
import { showToast } from '../utils/toast';
import ErrorToastContent from './common/ErrorToastContent';
import { useOperationManager } from '../hooks/useOperationManager';

/**
 * Sub-component for Replace Text operation parameters.
 */
const ReplaceParams = ({ replaceTarget, setReplaceTarget, replaceWith, setReplaceWith }) => (
  <>
    <div>
      <label htmlFor="replaceTarget" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Target text</label>
      <input id="replaceTarget" type="text" value={replaceTarget} onChange={e => setReplaceTarget(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required />
    </div>
    <div>
      <label htmlFor="replaceWith" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Replace with</label>
      <input id="replaceWith" type="text" value={replaceWith} onChange={e => setReplaceWith(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
    </div>
  </>
);

/**
 * Sub-component for Slice Text operation parameters.
 */
const SliceParams = ({ sliceStart, setSliceStart, sliceEnd, setSliceEnd, maxSliceLength }) => {
  const handleSliceStart = (e) => {
    const v = Number.parseInt(e.target.value, 10);
    setSliceStart(v);
    if (v > sliceEnd) setSliceEnd(v);
  };
  const handleSliceEnd = (e) => {
    const v = Number.parseInt(e.target.value, 10);
    setSliceEnd(v);
    if (v < sliceStart) setSliceStart(v);
  };

  return (
    <>
      <div>
        <label htmlFor="sliceStart" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start index</label>
        <div className="flex items-center gap-1">
          <input
            id="sliceStart"
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
        <label htmlFor="sliceEnd" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End index</label>
        <div className="flex items-center gap-1">
          <input
            id="sliceEnd"
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
};

/**
 * Sub-component for Pad Filename operation parameters.
 */
const PadParams = ({ padCount, setPadCount }) => (
  <div>
    <label htmlFor="padCount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Count</label>
    <input id="padCount" type="number" value={padCount} onChange={e => setPadCount(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required min="1" />
  </div>
);

function ExecuteSidebar() {
  const dispatch = useDispatch();
  const selectedFileIds = useSelector(state => state.drive.selectedFileIds);
  const files = useSelector(state => state.drive.files);
  const nextFilesPageToken = useSelector(state => state.drive.nextFilesPageToken);

  const {
      operation,
      isDropdownOpen,
      toggleDropdown,
      selectOperation,
      params,
      getExecutionParams
  } = useOperationManager();

  const [isExecuting, setIsExecuting] = useState(false);

  const targetFiles = files.filter(f => selectedFileIds.includes(f.id));
  const maxSliceLength = targetFiles.length > 0 ? Math.max(...targetFiles.map(f => f.name.length), 1) : 100;

  const handleExecutionSuccess = (updatedFiles) => {
    if (!Array.isArray(updatedFiles)) return;
    const newFiles = files.map(f => {
      const updated = updatedFiles.find(uf => uf.id === f.id);
      return updated ? { ...f, name: updated.newName } : f;
    });
    dispatch(setFiles({ files: newFiles, nextPageToken: nextFilesPageToken }));
    dispatch(clearAllSelections());
  };

  const handleExecutionError = (errorInfo) => {
    const errorMsg = `Execution failed: ${errorInfo.error || errorInfo.message || errorInfo}`;
    if (errorInfo.errorCode === 'ETIMEDOUT' || errorInfo.errorCode === 'NETWORK_ERROR') {
      showToast({
        component: <ErrorToastContent error={errorMsg} />,
        duration: 10000,
        close: true,
        gravity: "bottom",
        position: "right",
        className: "error-toast"
      });
    } else {
      dispatch(addNotification({ message: errorMsg, type: "error" }));
    }
  };

  const handleExecute = async () => {
    if (targetFiles.length === 0) return;
    const executionParams = getExecutionParams();
    if (!executionParams) return;

    setIsExecuting(true);
    try {
      const result = await globalThis.electronAPI?.executeOperation(operation, executionParams, targetFiles);
      if (!result) return;
      if (result.error) {
          handleExecutionError(result);
      } else {
          handleExecutionSuccess(result);
      }
    } catch (error) {
      console.error("Execution error:", error);
      handleExecutionError(error);
    } finally {
      setIsExecuting(false);
    }
  };

  const operationLabels = {
    replace: 'Replace Text',
    slice: 'Slice Text',
    pad: 'Pad Filename',
  };
  const currentOperationLabel = operationLabels[operation] || 'Choose an operation';

  return (
    <div className="block p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white select-none">Execute Menu</h5>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Target: {selectedFileIds.length} file(s)</p>
      
      <label htmlFor="operationDropdown" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white select-none">Select Operation</label>
      <div className="relative mb-4">
        <button
          id="operationDropdown"
          onClick={toggleDropdown}
          className="text-gray-900 bg-gray-50 border border-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center justify-between w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-800 select-none"
          type="button"
        >
          {currentOperationLabel}
          <svg className="w-2.5 h-2.5 ms-3" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-full dark:bg-gray-700 absolute top-full mt-1 border border-gray-200 dark:border-gray-600">
            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200 select-none">
              <li><button onClick={() => selectOperation('replace')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Replace Text</button></li>
              <li><button onClick={() => selectOperation('slice')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Slice Text</button></li>
              <li><button onClick={() => selectOperation('pad')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Pad Filename</button></li>
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {operation === 'replace' && <ReplaceParams {...params} />}
        {operation === 'slice' && <SliceParams {...params} maxSliceLength={maxSliceLength} />}
        {operation === 'pad' && <PadParams {...params} />}
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