import GoogleDriveIcon from '../../../assets/google-drive.svg?react';

function AuthView() {
  const handleAuthorize = async () => {
    // The main process will handle opening the OAuth window and triggering onAuthSuccess
    globalThis.electronAPI?.authorize();
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-2rem)]">
      <button
        type="button"
        onClick={handleAuthorize}
        data-testid="auth-button"
        className="flex justify-center items-center w-full max-w-sm mx-auto cursor-pointer"
      >
        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <GoogleDriveIcon className="w-12 h-12 text-gray-500 dark:text-gray-400 mb-4" aria-label="Google Drive" />
            <p className="mb-2 text-lg font-bold text-gray-700 dark:text-gray-300">Authorize with Google</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-4">
              Click here to sign in and grant permission to access your Google Drive files.
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

export default AuthView;
