// Updated scanHtmlFiles function with path exclusion
export const scanHtmlFiles = (directory, options = {}) => {
  const htmlFiles = []
  const { pathsToExclude = [] } = options

  try {
    const files = fs.readdirSync(directory, { recursive: true })

    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.html') {
        // Get the full path
        const fullPath = path.join(directory, file)

        // Get relative path by removing the base directory
        // and normalize it to use forward slashes for consistency
        let relPath = file.split(path.sep).join('/')

        // Ensure the path starts with a forward slash for matching
        if (!relPath.startsWith('/')) {
          relPath = '/' + relPath
        }

        // Check if this path should be excluded
        const shouldExclude = pathsToExclude.some(pattern => {
          // Exact path match
          if (pattern === relPath) {
            return true
          }

          // Root directory match
          if (pattern === '/' && !relPath.substring(1).includes('/')) {
            return true
          }

          // Wildcard pattern (directory/*)
          if (pattern.endsWith('/*')) {
            const prefix = pattern.slice(0, -1) // Remove the *
            return relPath.startsWith(prefix)
          }

          return false
        })

        if (!shouldExclude) {
          htmlFiles.push(fullPath)
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory: ${error.message}`)
  }

  return htmlFiles
}
