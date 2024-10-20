import { browser, $, expect } from '@wdio/globals'
import { assuredworkloads } from 'googleapis/build/src/apis/assuredworkloads'

describe('Electron Testing', () => {
    it('should print application title', async () => {
        const title = await browser.getTitle()
        await expect(title).toEqual("MFM Gdrive")
    })
    it('should show button authorize', async () => {
        const btnauthorize = await $("#authorize")
        await expect(btnauthorize).toBeDisplayed()
    })
})
