import { browser, $, expect } from '@wdio/globals'

describe('Electron Testing', () => {
    it('should print application title', async () => {
        const title = await browser.getTitle()
        await expect(title).toEqual("MFM Gdrive")
    })

    // This test assumes the app is already authorized,
    // as is common in a local test environment with a cached token.
    it('should show refresh button', async () => {
        const btnRefresh = await $("#refresh-button")
        // The main view can take a moment to appear after authorization
        await btnRefresh.waitForDisplayed({ timeout: 5000 })
        await expect(btnRefresh).toBeDisplayed()
    })

    // This test is skipped because it requires an interactive OAuth flow,
    // which is not possible in a CI environment.
    // It's kept here for local testing on a clean environment.
    it.skip('click authorize and get mfm-test folder', async () => {
        const btnauthorize = await $("#authorize-button") // Fixed selector
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
