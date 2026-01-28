import { browser, $, expect } from '@wdio/globals'

describe('Electron Testing', () => {
    it('should print application title', async () => {
        const title = await browser.getTitle()
        await expect(title).toEqual("MFM Gdrive")
    })

    it('should show button authorize', async () => {
        const btnAuthorize = await $("#authorize")
        await btnAuthorize.waitForDisplayed({ timeout: 10000, timeoutMsg: "Authorize button was not displayed" })
        await expect(btnAuthorize).toBeDisplayed()
    })

    // This test requires an interactive OAuth flow and is best run locally.
    // It now includes scrolling to find the folder.
    it('click authorize and get mfm-test folder', async () => {
        const btnAuthorize = await $("#authorize")
        // This click is only necessary if the button is actually there (clean environment)
        if (await btnAuthorize.isDisplayed()) {
            await btnAuthorize.click()
        }

        const folderList = await $("#folder-list")
        
        // Wait until the folder list is populated and scroll until "mfm-test" is found
        await browser.waitUntil(async function () {
            // Scroll down within the folder list element
            await browser.execute((el) => {
                el.scrollTop = el.scrollHeight;
            }, folderList);

            // Check if the text is now visible
            const listText = await folderList.getText()
            return listText.includes("mfm-test")
          }, {
            timeout: 15000, // Increased timeout to allow for auth and scrolling
            timeoutMsg: 'failed to find "mfm-test" in folder list after scrolling'
        })
    })

    //  cannot run because of bug https://github.com/electron/electron/issues/33942
    // it('get file list', async () => {
    //     await browser.ocrClickOnText({text:"mfm-test"})

    //     const fileList = await $("#files")
    //     await browser.waitUntil(async function () {
    //         let res = await fileList.getText()
    //         return res.includes("mymfm")
    //       }, {
    //         timeout: 5000,
    //         timeoutMsg: 'failed to get mfm-test list files'
    //     })
    // })
})
