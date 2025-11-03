const Swal = require('sweetalert2');

// Helper constant for SweetAlert2 input styling
const inputClass =
    `block w-full p-2 text-gray-900 border border-gray-300 rounded-lg
bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500
mb-2
`;

// Custom SweetAlert2 mixin for consistent styling
const myswal = Swal.mixin({
    customClass: {
        title: `block mb-2 text-sm font-medium text-gray-900 dark:text-white`,
        confirmButton: `px-3 py-2 text-xs font-medium text-center text-white bg-blue-700
        rounded-sm hover:bg-blue-800 focus:ring-4 focus:outline-none
        focus:ring-blue-300`
    },
    buttonsStyling: false
});

module.exports = {
    myswal,
    inputClass
};