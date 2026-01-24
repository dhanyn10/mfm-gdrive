const { Modal } = require('flowbite');

let replaceTextModal;
let sliceTextModal;
let padFilenameModal;

const options = {
    backdropClasses: 'bg-gray-900 opacity-50 fixed inset-0 z-40'
};

function showReplaceTextModal(callback) {
    if (!replaceTextModal) {
        const replaceTextModalElement = document.getElementById('replace-text-modal');
        replaceTextModal = new Modal(replaceTextModalElement, options);
        const replaceTextCloseButton = document.querySelector('[data-modal-hide="replace-text-modal"]');
        replaceTextCloseButton.addEventListener('click', () => replaceTextModal.hide());
    }
    replaceTextModal.show();
    const runButton = document.getElementById('run-replace-text');

    const newRunButton = runButton.cloneNode(true);
    runButton.parentNode.replaceChild(newRunButton, runButton);

    newRunButton.addEventListener('click', () => {
        const from = document.getElementById('from').value;
        const to = document.getElementById('to').value;
        callback(from, to);
        replaceTextModal.hide();
    });
}

function showSliceTextModal(callback) {
    if (!sliceTextModal) {
        const sliceTextModalElement = document.getElementById('slice-text-modal');
        sliceTextModal = new Modal(sliceTextModalElement, options);
        const sliceTextCloseButton = document.querySelector('[data-modal-hide="slice-text-modal"]');
        sliceTextCloseButton.addEventListener('click', () => sliceTextModal.hide());
    }
    sliceTextModal.show();
    const runButton = document.getElementById('run-slice-text');

    const newRunButton = runButton.cloneNode(true);
    runButton.parentNode.replaceChild(newRunButton, runButton);

    newRunButton.addEventListener('click', () => {
        const start = document.getElementById('start').value;
        const end = document.getElementById('end').value;
        callback(start, end);
        sliceTextModal.hide();
    });
}

function showPadFilenameModal(callback) {
    if (!padFilenameModal) {
        const padFilenameModalElement = document.getElementById('pad-filename-modal');
        padFilenameModal = new Modal(padFilenameModalElement, options);
        const padFilenameCloseButton = document.querySelector('[data-modal-hide="pad-filename-modal"]');
        padFilenameCloseButton.addEventListener('click', () => padFilenameModal.hide());
    }
    padFilenameModal.show();
    const runButton = document.getElementById('run-pad-filename');

    const newRunButton = runButton.cloneNode(true);
    runButton.parentNode.replaceChild(newRunButton, runButton);

    newRunButton.addEventListener('click', () => {
        const numPrefix = document.getElementById('numprefix').value;
        callback(numPrefix);
        padFilenameModal.hide();
    });
}

module.exports = {
    showReplaceTextModal,
    showSliceTextModal,
    showPadFilenameModal,
};
