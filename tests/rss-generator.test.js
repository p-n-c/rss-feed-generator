// tests/rss-generator.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import * as utils from '../node/utils.js'
import { generateRssFeed } from '../node/rss-generator.js'

// Mock utils functions and fs modules
vi.mock('../node/utils.js')
vi.mock('fs')

describe('generateRssFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks for the utility functions
    utils.scanHtmlFiles.mockReturnValue([
      '/src/blog/article1.html',
      '/src/blog/article2.html',
    ])

    utils.extractMetadata.mockImplementation(file => {
      if (file === '/src/blog/article1.html') {
        return {
          title: 'Article 1',
          link: 'https://people-and-code.com/blog/article1',
          description: 'First article description',
          pubDate: 'Wed, 01 Mar 2025 10:00:00 GMT',
          guid: 'https://people-and-code.com/blog/article1',
        }
      } else if (file === '/src/blog/article2.html') {
        return {
          title: 'Article 2',
          link: 'https://people-and-code.com/blog/article2',
          description: 'Second article description',
          pubDate: 'Thu, 02 Mar 2025 11:30:00 GMT',
          guid: 'https://people-and-code.com/blog/article2',
        }
      }
      return null
    })

    utils.generateRssXml.mockReturnValue(
      '<?xml version="1.0" encoding="UTF-8"?><rss>Mock RSS content</rss>'
    )
  })

  it('should generate an RSS feed from HTML files', async () => {
    const src = '/src/blog'
    const feed = {
      title: 'People and Code, At Your Disposal',
      link: 'https://people-and-code.com/',
      description: 'Latest articles from People and Code',
      outputPath: 'feed.rss',
    }
    const options = {
      images: {
        main: 'https://people-and-code.com/image.png',
      },
      pathsToExclude: [],
    }

    await generateRssFeed(src, 'src', feed, options)

    // Verify the workflow
    expect(utils.scanHtmlFiles).toHaveBeenCalledWith(src, options)
    expect(utils.extractMetadata).toHaveBeenCalledTimes(2)

    expect(utils.extractMetadata).toHaveBeenCalledWith(
      '/src/blog/article1.html',
      'src',
      feed
    )
    expect(utils.extractMetadata).toHaveBeenCalledWith(
      '/src/blog/article2.html',
      'src',
      feed
    )

    expect(utils.generateRssXml).toHaveBeenCalledWith(
      [
        {
          title: 'Article 1',
          link: 'https://people-and-code.com/blog/article1',
          description: 'First article description',
          pubDate: 'Wed, 01 Mar 2025 10:00:00 GMT',
          guid: 'https://people-and-code.com/blog/article1',
        },
        {
          title: 'Article 2',
          link: 'https://people-and-code.com/blog/article2',
          description: 'Second article description',
          pubDate: 'Thu, 02 Mar 2025 11:30:00 GMT',
          guid: 'https://people-and-code.com/blog/article2',
        },
      ],
      feed,
      options
    )

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      feed.outputPath,
      '<?xml version="1.0" encoding="UTF-8"?><rss>Mock RSS content</rss>'
    )
  })

  it('should handle empty HTML files array', async () => {
    utils.scanHtmlFiles.mockReturnValue([])

    const src = '/empty/directory'
    const feed = {
      title: 'People and Code, At Your Disposal',
      link: 'https://people-and-code.com/',
      description: 'Latest articles from People and Code',
      outputPath: 'feed.rss',
    }
    const options = {
      images: {
        main: 'https://people-and-code.com/image.png',
      },
    }

    await generateRssFeed(src, 'src', feed, options)

    expect(utils.scanHtmlFiles).toHaveBeenCalledWith(src, options)
    expect(utils.extractMetadata).not.toHaveBeenCalled()
    expect(utils.generateRssXml).toHaveBeenCalledWith([], feed, options)
    expect(fs.writeFileSync).toHaveBeenCalled()
  })

  it('should handle null metadata', async () => {
    utils.extractMetadata.mockReturnValue(null)

    const src = '/src/blog'
    const feed = {
      title: 'People and Code, At Your Disposal',
      link: 'https://people-and-code.com/',
      description: 'Latest articles from People and Code',
      outputPath: 'feed.rss',
    }
    const options = {
      images: {
        main: 'https://people-and-code.com/image.png',
      },
    }

    await generateRssFeed(src, 'src', feed, options)

    expect(utils.scanHtmlFiles).toHaveBeenCalledWith(src, options)
    expect(utils.extractMetadata).toHaveBeenCalledTimes(2)
    expect(utils.generateRssXml).toHaveBeenCalledWith([], feed, options)
    expect(fs.writeFileSync).toHaveBeenCalled()
  })
})
