
const { Modal } = require('flowbite');

let replaceTextModal;
let sliceTextModal;
let padFilenameModal;

function initModals() {
    const options = {
        backdropClasses: 'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40'
    };

    const replaceTextModalElement = document.getElementById('replace-text-modal');
    replaceTextModal = new Modal(replaceTextModalElement, options);
    const replaceTextCloseButton = document.querySelector('[data-modal-hide="replace-text-modal"]');
    replaceTextCloseButton.addEventListener('click', () => replaceTextModal.hide());

    const sliceTextModalElement = document.getElementById('slice-text-modal');
    sliceTextModal = new Modal(sliceTextModalElement, options);
    const sliceTextCloseButton = document.querySelector('[data-modal-hide="slice-text-modal"]');
    sliceTextCloseButton.addEventListener('click', () => sliceTextModal.hide());

    const padFilenameModalElement = document.getElementById('pad-filename-modal');
    padFilenameModal = new Modal(padFilenameModalElement, options);
    const padFilenameCloseButton = document.querySelector('[data-modal-hide="pad-filename-modal"]');
    padFilenameCloseButton.addEventListener('click', () => padFilenameModal.hide());
}

function showReplaceTextModal(callback) {
    replaceTextModal.show();
    const runButton = document.getElementById('run-replace-text');
    runButton.onclick = () => {
        const from = document.getElementById('from').value;
        const to = document.getElementById('to').value;
        callback(from, to);
        replaceTextModal.hide();
    };
}

function showSliceTextModal(callback) {
    sliceTextModal.show();
    const runButton = document.getElementById('run-slice-text');
    runButton.onclick = () => {
        const start = document.getElementById('start').value;
        const end = document.getElementById('end').value;
        callback(start, end);
        sliceTextModal.hide();
    };
}

function showPadFilenameModal(callback) {
    padFilenameModal.show();
    const runButton = document.getElementById('run-pad-filename');
    runButton.onclick = () => {
        const numPrefix = document.getElementById('numprefix').value;
        callback(numPrefix);
        padFilenameModal.hide();
    };
}

module.exports = {
    initModals,
    showReplaceTextModal,
    showSliceTextModal,
    showPadFilenameModal,
};
