import { browser, $, expect } from '@wdio/globals'

describe('Electron Testing', () => {
    it('should print application title', async () => {
        const title = await browser.getTitle()
        await expect(title).toEqual("MFM Gdrive")
    })

    // This test is for a clean environment like CI where no auth token exists.
    // The app should correctly display the authorize button.
    it('should show authorize button in a clean environment', async () => {
        const btnAuthorize = await $("#authorize-button") // Use the correct selector
        // In a clean environment, the authorize button should appear.
        await btnAuthorize.waitForDisplayed({ timeout: 10000, timeoutMsg: "Authorize button was not displayed in time" })
        await expect(btnAuthorize).toBeDisplayed()
    })

    // This test is for a local environment where an auth token is likely cached.
    // It is skipped in CI because the authorize button will be shown instead.
    it.skip('should show refresh button in an authorized environment', async () => {
        const btnRefresh = await $("#refresh-button")
        await btnRefresh.waitForDisplayed({ timeout: 5000 })
        await expect(btnRefresh).toBeDisplayed()
    })

    // This test is skipped because it requires an interactive OAuth flow,
    // which is not possible in a CI environment.
    it.skip('click authorize and get mfm-test folder', async () => {
        const btnAuthorize = await $("#authorize-button")
        await btnAuthorize.click()
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
