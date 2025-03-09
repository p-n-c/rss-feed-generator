// tests/utils.test.js - Adding tests for scanHtmlFiles with path exclusion
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { scanHtmlFiles } from '../utils.js'

// Add this to the existing scanHtmlFiles describe block
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

    const result = scanHtmlFiles('/src', { pathsToExclude: ['/'] })

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
