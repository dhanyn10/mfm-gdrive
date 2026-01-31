![logo](/assets/icon.png)
# mfm-gdrive
Easy rename your files in Google Drive

## Install
1. Clone this repo
    ```bash
    git clone https://github.com/dhanyn10/mfm-gdrive.git
    ```
2. Move to the project directory
    ```bash
    cd mfm-gdrive
    ```
3. Install dependencies
    ```bash
    npm install
    ```

## Usage
- Generate CSS (optional)
    ```bash
    npm run css-gen
    ```
- Run the application
    ```bash
    npm start
    ```

## How to Use
1. Click the **Authorize** button to grant the app access to your Google Drive metadata.
2. The **Left Sidebar** displays your folder structure. The **Main Area** shows files within the selected folder. To navigate back to the parent folder, click the **"..."** item in the folder list.
3. Select the files you wish to rename. You can select multiple files using `Shift + Click` or by using the **Select All** button.
4. Click the **Next** button or the **Execute** tab to switch the sidebar to the **Execute Menu**.
5. Select an operation (**Replace Text**, **Slice Text**, or **Pad Filename**) from the dropdown menu.
6. Adjust the operation parameters in the sidebar. You can toggle **Preview** on individual files to see the expected result.
7. Click the **RUN** button to execute the rename operation.
8. If needed, you can **Undo** the operation from the notification popup that appears after execution.

## Features

### Replace Text
Replace specific text within filenames.

**Example:**
If you have files:
```
my-file-1.pdf
my-file-2.pdf
```
Select **Replace Text**, set **From** to `my` and **To** to `our`.
Result:
```
our-file-1.pdf
our-file-2.pdf
```

### Slice Text
Remove a specific range of characters from filenames.

**Overview:**
Use the sliders or input fields to specify the **Start** and **End** positions. Characters starting from the **Start** position up to (but not including) the **End** position will be removed. The preview highlights the characters to be removed.

**Example:**
If you have `report-2023-final.pdf` and you want to remove `-final` (assuming it is at indices 11 to 17).
Set **Start** to `11` and **End** to `17`.

### Pad Filename
Add leading zeros to numbers in filenames to ensure consistent length.

**Overview:**
Specify the **Expected Length** for the number part of the filename. This is useful for sorting files correctly.

**Example:**
If you have:
```
file-1.pdf
file-10.pdf
```
Set **Expected Length** to `3`.
Result:
```
file-001.pdf
file-010.pdf
```