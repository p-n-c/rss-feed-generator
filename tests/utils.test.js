// tests/utils.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  scanHtmlFiles,
  getDirectory,
  extractMetadata,
  generateRssXml,
} from '../node/utils.js'

// Mock the fs and path modules
vi.mock('fs')
vi.mock('path')
vi.mock('../node/dirname.js', () => ({
  __dirname: '/mock/project/directory',
}))

describe('scanHtmlFiles', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('should scan a directory and return HTML files', () => {
    // Mock the filesystem
    fs.readdirSync.mockReturnValue([
      'file1.html',
      'file2.txt',
      'file3.html',
      'subdirectory/file4.html',
    ])

    // Mock path.extname to return proper extensions
    path.extname.mockImplementation(file => {
      if (file.endsWith('.html')) return '.html'
      if (file.endsWith('.txt')) return '.txt'
      return ''
    })

    // Mock path.join to simply concatenate strings with a slash
    path.join.mockImplementation((...args) => args.join('/'))

    const result = scanHtmlFiles('/test/directory')

    expect(fs.readdirSync).toHaveBeenCalledWith('/test/directory', {
      recursive: true,
    })
    expect(result).toEqual([
      '/test/directory/file1.html',
      '/test/directory/file3.html',
      '/test/directory/subdirectory/file4.html',
    ])
  })

  it('should handle errors and return an empty array', () => {
    // Mock the filesystem to throw an error
    fs.readdirSync.mockImplementation(() => {
      throw new Error('Directory not found')
    })

    // Mock console.error to avoid polluting test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = scanHtmlFiles('/nonexistent/directory')

    expect(fs.readdirSync).toHaveBeenCalledWith('/nonexistent/directory', {
      recursive: true,
    })
    expect(consoleSpy).toHaveBeenCalled()
    expect(result).toEqual([])

    consoleSpy.mockRestore()
  })
})

describe('scanHtmlFiles with path exclusion', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Mock path.extname to return proper extensions
    path.extname.mockImplementation(file => {
      if (file.endsWith('.html')) return '.html'
      if (file.endsWith('.txt')) return '.txt'
      return ''
    })

    // Mock path.join to simply concatenate strings with a slash
    path.join.mockImplementation((...args) => args.join('/'))

    // Mock path.sep to use forward slash (Unix-like)
    path.sep = '/'
  })

  it('should exclude files in the root directory', () => {
    // Mock the filesystem
    fs.readdirSync.mockReturnValue([
      'home.html',
      'about.html',
      'blog/article1.html',
      'blog/article2.html',
    ])

    const result = scanHtmlFiles('/src', {
      // root: 'src',
      pathsToExclude: ['/'],
      feed: {
        title: 'People and Code, At Your Disposal',
        link: 'https://people-and-code.com/',
        description: 'Latest articles from People and Code',
        outputPath: 'feed.rss',
      },
    })

    expect(fs.readdirSync).toHaveBeenCalledWith('/src', { recursive: true })
    // Only subdirectory files should be included, not root files
    expect(result).toEqual([
      '/src/blog/article1.html',
      '/src/blog/article2.html',
    ])
  })

  it('should exclude files matching exact paths', () => {
    // Mock the filesystem
    fs.readdirSync.mockReturnValue([
      'home.html',
      'about.html',
      'blog/article1.html',
      'blog/article2.html',
      'blog/featured.html',
    ])

    const result = scanHtmlFiles('/src', {
      pathsToExclude: ['/home.html', '/blog/featured.html'],
      feed: {
        title: 'People and Code, At Your Disposal',
        link: 'https://people-and-code.com/',
        description: 'Latest articles from People and Code',
        outputPath: 'feed.rss',
      },
    })

    expect(result).toEqual([
      '/src/about.html',
      '/src/blog/article1.html',
      '/src/blog/article2.html',
    ])
  })

  it('should exclude files matching wildcard patterns', () => {
    // Mock the filesystem
    fs.readdirSync.mockReturnValue([
      'home.html',
      'about.html',
      'blog/article1.html',
      'blog/article2.html',
      'docs/guide1.html',
      'docs/guide2.html',
      'docs/api/reference.html',
    ])

    const result = scanHtmlFiles('/src', {
      pathsToExclude: ['/docs/*'],
    })

    expect(result).toEqual([
      '/src/home.html',
      '/src/about.html',
      '/src/blog/article1.html',
      '/src/blog/article2.html',
    ])
  })

  it('should handle multiple exclusion patterns', () => {
    // Mock the filesystem
    fs.readdirSync.mockReturnValue([
      'home.html',
      'about.html',
      'blog/article1.html',
      'blog/article2.html',
      'docs/guide1.html',
      'docs/api/reference.html',
    ])

    const result = scanHtmlFiles('/src', {
      pathsToExclude: ['/', '/blog/article2.html'],
    })

    expect(result).toEqual([
      '/src/blog/article1.html',
      '/src/docs/guide1.html',
      '/src/docs/api/reference.html',
    ])
  })

  it('should specifically match your example case', () => {
    // Setup the exact example from your prompt
    fs.readdirSync.mockReturnValue([
      'home.html',
      'blog/article1.html',
      'blog/article2.html',
    ])

    const result = scanHtmlFiles('/src', {
      pathsToExclude: ['/home.html'],
    })

    expect(result).toEqual([
      '/src/blog/article1.html',
      '/src/blog/article2.html',
    ])
  })

  it('should handle Windows-style paths correctly', () => {
    // Temporarily change path.sep to Windows style
    const originalSep = path.sep
    path.sep = '\\'

    // Mock join to use Windows separators
    path.join.mockImplementation((...args) => args.join('\\'))

    // Windows-style paths in the filesystem
    fs.readdirSync.mockReturnValue([
      'home.html',
      'blog\\article1.html',
      'blog\\article2.html',
    ])

    const result = scanHtmlFiles('C:\\src', {
      pathsToExclude: ['/'], // Still using Unix-style in the patterns
    })

    // Expect Unix-style paths for comparison but Windows paths for output
    expect(result).toEqual([
      'C:\\src\\blog\\article1.html',
      'C:\\src\\blog\\article2.html',
    ])

    // Restore original separator
    path.sep = originalSep
  })
})

describe('getDirectory', () => {
  it('should join directory parts with the __dirname', () => {
    // Mock path.join
    path.join.mockImplementation((...args) => args.join('/'))

    const result = getDirectory('src', 'components')

    expect(path.join).toHaveBeenCalledWith(
      '/mock/project/directory',
      'src',
      'components'
    )
    expect(result).toBe('/mock/project/directory/src/components')
  })
})

describe('extractMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should extract metadata from HTML file', () => {
    // Sample HTML content
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Article</title>
          <meta name="description" content="This is a test article description">
          <meta name="date" content="2025-01-01T12:00:00Z">
        </head>
        <body>
          <p>This is a test paragraph.</p>
        </body>
      </html>
    `

    // Mock fs.readFileSync to return our sample HTML
    fs.readFileSync.mockReturnValue(sampleHtml)

    // Mock path functions
    path.basename.mockImplementation((filePath, ext) => {
      return filePath.split('/').pop().replace(ext, '')
    })

    path.parse.mockReturnValue({ dir: '/src/blog' })

    // Setup other mocks
    const mockRoot = 'src'
    const mockFeed = {
      title: 'People and Code, At Your Disposal',
      link: 'https://people-and-code.com/',
      description: 'Latest articles from People and Code',
      outputPath: 'feed.rss',
    }
    const result = extractMetadata(
      '/src/blog/test-article.html',
      mockRoot,
      mockFeed
    )

    expect(fs.readFileSync).toHaveBeenCalledWith(
      '/src/blog/test-article.html',
      'utf8'
    )
    expect(result).toEqual({
      title: 'Test Article',
      link: 'https://people-and-code.com/blog/test-article',
      description: 'This is a test article description',
      pubDate: new Date('2025-01-01T12:00:00Z').toUTCString(),
      guid: 'https://people-and-code.com/blog/test-article',
    })
  })

  it('should use fallback values when metadata is missing', () => {
    // Sample HTML with minimal content
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <p>This is a test paragraph with no metadata.</p>
        </body>
      </html>
    `

    // Mock fs functions
    fs.readFileSync.mockReturnValue(sampleHtml)
    fs.statSync.mockReturnValue({ mtime: new Date('2025-02-15T10:30:00Z') })

    // Mock path functions
    path.basename.mockReturnValue('minimal-article')
    path.parse.mockReturnValue({ dir: '/src/blog' })

    // Setup other mocks
    const mockRoot = 'src'
    const mockFeed = {
      title: 'People and Code, At Your Disposal',
      link: 'https://people-and-code.com/',
      description: 'Latest articles from People and Code',
      outputPath: 'feed.rss',
    }

    const result = extractMetadata(
      '/src/blog/minimal-article.html',
      mockRoot,
      mockFeed
    )

    expect(result).toEqual({
      title: 'minimal-article',
      link: 'https://people-and-code.com/blog/minimal-article',
      description: 'This is a test paragraph with no metadata.',
      pubDate: new Date('2025-02-15T10:30:00Z').toUTCString(),
      guid: 'https://people-and-code.com/blog/minimal-article',
    })
  })

  it('should handle errors and return null', () => {
    // Mock fs.readFileSync to throw an error
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File not found')
    })

    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = extractMetadata('/nonexistent/file.html', 'src', {
      link: 'https://people-and-code.com/',
    })

    expect(fs.readFileSync).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
    expect(result).toBeNull()

    consoleSpy.mockRestore()
  })
})

describe('generateRssXml', () => {
  it('should generate valid RSS XML', () => {
    // Sample feed options and items
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

    const items = [
      {
        title: 'Article 1',
        link: 'https://people-and-code.com/blog/article-1',
        description: 'This is the first article',
        pubDate: 'Wed, 01 Jan 2025 12:00:00 GMT',
        guid: 'https://people-and-code.com/blog/article-1',
      },
      {
        title: 'Article 2',
        link: 'https://people-and-code.com/blog/article-2',
        description: 'This is the second article',
        pubDate: 'Thu, 15 Jan 2025 15:30:00 GMT',
        guid: 'https://people-and-code.com/blog/article-2',
      },
    ]

    // Mock Date to return a fixed value for lastBuildDate
    const originalDate = global.Date
    const mockDate = new Date('2025-02-20T08:45:00Z')
    global.Date = class extends Date {
      constructor() {
        super()
        return mockDate
      }

      static now() {
        return mockDate.getTime()
      }
    }

    const result = generateRssXml(items, feed, options)

    // Restore original Date
    global.Date = originalDate

    // Check that the result is a string and contains expected elements
    expect(typeof result).toBe('string')
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(result).toContain(
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'
    )
    expect(result).toContain('<title>People and Code, At Your Disposal</title>')
    expect(result).toContain(
      '<lastBuildDate>Thu, 20 Feb 2025 08:45:00 GMT</lastBuildDate>'
    )
    expect(result).toContain('<title>Article 1</title>')
    expect(result).toContain(
      '<description><![CDATA[<img src="https://people-and-code.com/image.png"/>This is the first article]]></description>'
    )
    expect(result).toContain(
      '<guid>https://people-and-code.com/blog/article-1</guid>'
    )
    expect(result).toContain('<title>Article 2</title>')
  })

  it('should handle empty items array', () => {
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

    // Mock Date
    const originalDate = global.Date
    const mockDate = new Date('2025-02-20T08:45:00Z')
    global.Date = class extends Date {
      constructor() {
        super()
        return mockDate
      }
    }

    const result = generateRssXml([], feed, options)

    // Restore original Date
    global.Date = originalDate

    expect(typeof result).toBe('string')
    expect(result).toContain('<title>People and Code, At Your Disposal</title>')
    expect(result).not.toContain('<item>')
  })
})
