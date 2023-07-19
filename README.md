![logo](./app/icon.png)
# mfm-gdrive
Easy rename your files in Google Drive

## Install
1. Clone this repo
    ```bash
    git clone https://github.com/dhanyn10/mfm-gdrive.git
    ```
2. Install dependencies
    ```bash
    yarn
    ```
## Usage
- generate css (optional)
    ```bash
    yarn css
    ```
- run the application
    ```bash
    yarn start
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

## Function below NOT AVAILABLE YET, THEY STILL WAITING FOR DEVELOPMENT
### delete character by index
below is how to get the index character:  
![delete character by index](https://media.giphy.com/media/8qqqesHEL8YRHjbfwF/giphy.gif)
  
We will delete character `[Koenime]` from the filename. So you need to choose rename option **delete character by index** and fill **`from index`** with `0` and **`to index`** with `8`

### insert PadStart
padStart is pads the current string with given string until meet the required length, you can read more details [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart). You can use padStart to solve problem like below:

```
file-997.pdf
file-998.pdf
file-999.pdf
file-1000.pdf
```
From the list above, set  **`from index`** with `5`, **`to index`**  with `7`, **`pad with`** with `0`, **`length`** with `4`. The result will become:

```
file-0997.pdf
file-0998.pdf
file-0999.pdf
file-1000.pdf
```