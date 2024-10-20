import { browser, $, expect } from '@wdio/globals'

describe('Electron Testing', () => {
    it('should print application title', async () => {
        const title = await browser.getTitle()
        await expect(title).toEqual("MFM Gdrive")
    })
    it('should show button authorize', async () => {
        const btnauthorize = await $("#authorize")
        await expect(btnauthorize).toBeDisplayed()
    })

    it('click authorize and get mfm-test folder', async () => {
        const btnauthorize = await $("#authorize")
        await btnauthorize.click()
        const folderList = await $("#folder-list")
        await browser.waitUntil(async function () {
            let res = await folderList.getText()
            return res.includes("mfm-test")
          }, {
            timeout: 5000,
            timeoutMsg: 'failed to get mfm-test'
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
