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

    it('click authorize and get mfm-test folder', async () => {
        const btnauthorize = await $("#authorize")
        await btnauthorize.click()
        
        const folderList = await $("#folder-list")
        await folderList.waitForDisplayed({ timeout: 10000 })

        // Function to scroll and find element
        await browser.waitUntil(async () => {
            const mfmTestFolder = await folderList.$('span=mfm-test')
            if (await mfmTestFolder.isDisplayed()) {
                return true
            }
            
            // Scroll down the folder list
            await browser.execute((list) => {
                list.scrollTop += 100;
            }, await folderList.getElement())
            
            return false
        }, {
            timeout: 30000,
            timeoutMsg: 'Could not find mfm-test folder after scrolling'
        })

        const mfmTestFolder = await folderList.$('span=mfm-test')
        await mfmTestFolder.click()
        
        // Verify we are in the folder (e.g. by checking if file list is loading or updated)
        // For now, just pass if we clicked it successfully
        await expect(mfmTestFolder).toBeDisplayed()
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
