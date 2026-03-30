import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSlicePreview, setOperationPreview } from '../store/uiSlice';

export const useOperationManager = () => {
  const dispatch = useDispatch();
  const [operation, setOperation] = useState(''); // 'replace', 'slice', 'pad'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form states
  const [replaceTarget, setReplaceTarget] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [sliceStart, setSliceStart] = useState(0);
  const [sliceEnd, setSliceEnd] = useState(0);
  const [padCount, setPadCount] = useState('');

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const selectOperation = (op) => {
    setOperation(op);
    setIsDropdownOpen(false);
    if (op !== 'slice') dispatch(setSlicePreview({ active: false }));
  };

  // Sync operation state to Redux for general previews
  useEffect(() => {
    if (!operation) {
      dispatch(setOperationPreview({ active: false, type: '', params: {} }));
      return;
    }

    let params = {};
    if (operation === 'replace') {
      params = { search: replaceTarget, replace: replaceWith };
    } else if (operation === 'slice') {
      params = { start: sliceStart, end: sliceEnd || undefined };
    } else if (operation === 'pad') {
      params = { position: 'start', count: Number.parseInt(padCount, 10), char: '0' };
    }

    dispatch(setOperationPreview({ active: true, type: operation, params }));
  }, [operation, replaceTarget, replaceWith, sliceStart, sliceEnd, padCount, dispatch]);

  // Sync slice indices to Redux for specific slice UI
  useEffect(() => {
    if (operation === 'slice') {
      dispatch(setSlicePreview({ active: true, start: sliceStart, end: sliceEnd }));
    }
  }, [operation, sliceStart, sliceEnd, dispatch]);

  const getExecutionParams = () => {
    if (operation === 'replace') {
      if (!replaceTarget) return null;
      return { search: replaceTarget, replace: replaceWith };
    }
    if (operation === 'slice') {
      return { start: sliceStart, end: sliceEnd || undefined };
    }
    if (operation === 'pad') {
      if (!padCount) return null;
      return { position: 'start', count: Number.parseInt(padCount, 10), char: '0' };
    }
    return null;
  };

  return {
    operation,
    isDropdownOpen,
    toggleDropdown,
    selectOperation,
    params: {
        replaceTarget, setReplaceTarget,
        replaceWith, setReplaceWith,
        sliceStart, setSliceStart,
        sliceEnd, setSliceEnd,
        padCount, setPadCount
    },
    getExecutionParams
  };
};
