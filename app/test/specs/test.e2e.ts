import { browser, $, expect } from '@wdio/globals'

describe('Electron Testing', () => {
    it('should print application title', async () => {
        var title = await browser.getTitle()
        await expect(title).toEqual("MFM Gdrive")
    })
})

