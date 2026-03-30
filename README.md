![logo](/assets/icon.png)

# MFM GDrive

**MFM GDrive** is a powerful and lightweight desktop application designed to make bulk renaming of files in your Google Drive simple, fast, and secure. Built with a modern technology stack including [Electron](https://www.electronjs.org/), [React](https://reactjs.org/), and [Tailwind CSS](https://tailwindcss.com/), it provides a seamless user experience directly from your desktop.

![License](https://img.shields.io/badge/License-MIT-green)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=dhanyn10_mfm-gdrive&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=dhanyn10_mfm-gdrive)

---

## Overview

Renaming multiple files in Google Drive can be a tedious and time-consuming process. MFM GDrive solves this by allowing you to easily browse your Google Drive directories, select the files you want to update, and apply batch renaming operations instantly.

By authenticating directly with the Google Drive API, the application ensures that your file operations are processed securely without downloading or uploading the files themselves—only the metadata is modified, making the process incredibly fast.

### Core Capabilities

- **Batch File Renaming:** Apply naming changes to multiple files simultaneously.
- **Replace Text:** Find and replace specific strings within filenames.
- **Slice Text:** Remove characters from a specific range of indices in the filename.
- **Pad Filename:** Add leading zeros to numeric parts of filenames to ensure consistent lengths and proper sorting.
- **Live Preview:** See exactly what the new filenames will look like before executing the operation.
- **Undo Operations:** Easily revert changes if you make a mistake.
- **Secure Authentication:** Uses Google's official OAuth 2.0 flow to securely connect to your Drive.

## Under the Hood

MFM GDrive is an open-source project that leverages modern web technologies to deliver a robust desktop experience:

* **Core Framework:** [Electron](https://www.electronjs.org/) wraps the web application to run as a native desktop client.
* **User Interface:** Built with [React](https://reactjs.org/) and styled with [Tailwind CSS](https://tailwindcss.com/) for a clean, responsive, and intuitive design.
* **State Management:** Uses [Redux Toolkit](https://redux-toolkit.js.org/) to handle complex application states like folder hierarchies and file selections.
* **Google Integration:** Communicates with Google's servers using the official [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client).

## Contributing

We welcome contributions! Whether you want to fix a bug, add a new feature, or improve documentation, your help is appreciated. Please feel free to open an issue or submit a pull request on our GitHub repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
