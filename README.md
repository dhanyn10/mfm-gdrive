![logo](icon.png)
# mfm-gdrive
Easy rename your files in Google Drive

## Install
1. Clone this repo
    ```bash
    git clone https://github.com/dhanyn10/mfm-gdrive.git
    ```
2. move to /app
    ```
    cd app
    ```
2. Install dependencies
    ```bash
    npm install
    ```
## Usage
- generate css (optional)
    ```bash
    npm run css-gen
    ```
- run the application
    ```bash
    npm start
    ```
## How to Use
1. click button **authorize** to let the apps gain authorization to your Google Drive metadata
2. **Left sidebar** shows you folder view; **right sidebar** shows you files and folder. If you need to return back to previous(parent) folder, you can click to folder **"..."**
3. choose any files you needed to change the names. Also you can choose multiple files by using `shift + click`
6. And finally, click **(play)** button to execute the rename function.

## Features Example

### change filename by name
you can change name for every file by typing file name you need to change. if you have file list like below:
```
my-file-1.pdf
my-file-2.pdf
my-file-3.pdf
my-file-4.pdf
```
choose rename option **change filename by name**, then fill the input form **`from`** with `my` and **`to`** with `our`. Your filename list will change like below:
```
our-file-1.pdf
our-file-2.pdf
our-file-3.pdf
our-file-4.pdf
```

### change filename by Position
#### Overview
The "Change File Name by Position" operation enables precise manipulation of filenames by specifying a start and an end position. Characters within the specified range will be removed from the filename. This operation is particularly useful for cleaning up filenames that have unwanted prefixes, suffixes, or segments in the middle.

#### How It Works
When you select "Change File Name by Position" and click "RUN", a dialog will appear prompting you to enter two values:
- Start: The 1-based numerical position where you want to begin removing characters.
- End: The 1-based numerical position where you want to end removing characters. The character at this 'end' position will also be removed.

### Insert PadStart
padStart is pads the current string with given string until meet the required length, you can read more details [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart). You can use padStart to solve problem like below:

```
file-997.pdf
file-998.pdf
file-999.pdf
file-1000.pdf
```
From the list above, set expected value with `4`. The result will become:

```
file-0997.pdf
file-0998.pdf
file-0999.pdf
file-1000.pdf
```