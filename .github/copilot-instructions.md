# Hugo Blog with Eureka Theme

Hugo blog using the Eureka theme, built with Hugo extended and deployed to GitHub Pages. The blog contains technical posts about Linux, bioinformatics, RNA-seq analysis, and related topics.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, build, and test the repository:

1. **Install Hugo Extended v0.122.0**:
   ```bash
   wget -O /tmp/hugo.deb https://github.com/gohugoio/hugo/releases/download/v0.122.0/hugo_extended_0.122.0_linux-amd64.deb
   sudo dpkg -i /tmp/hugo.deb
   hugo version
   ```

2. **Install Node.js dependencies** (PostCSS and Tailwind CSS are required for theme CSS processing):
   ```bash
   npm install postcss-cli tailwindcss
   ```

3. **Install theme dependencies**:
   ```bash
   cd themes/hugo-eureka
   npm install
   cd ../..
   ```

4. **Build the site**:
   ```bash
   hugo --minify
   ```
   - **NEVER CANCEL**: Build takes 2-3 seconds normally. Set timeout to 30+ seconds minimum.
   - Build generates static files in `public/` directory
   - CSS is processed through PostCSS/Tailwind pipeline during build

5. **Test the build**:
   ```bash
   # Verify build output
   ls public/
   # Check that CSS and JS files are generated
   ls public/css/ public/js/
   ```

### Development workflow:

1. **Start development server**:
   ```bash
   hugo server --bind 0.0.0.0 --port 1313
   ```
   - Development server starts in ~2 seconds
   - Available at http://localhost:1313/
   - Automatically rebuilds on file changes
   - Use `--disableFastRender` for full rebuilds when testing changes

2. **Create new content**:
   ```bash
   hugo new posts/my-new-post.md
   ```
   - New posts created in `content/posts/`
   - Posts are created as drafts by default (set `draft: false` to publish)
   - Include categories and tags in frontmatter for proper organization

3. **Content structure**:
   - Blog posts: `content/posts/`
   - Documentation: `content/docs/`
   - Authors: `content/authors/`
   - Homepage sections: `content/homepage/`

## Validation

### Always manually validate any changes:

1. **Build validation**:
   ```bash
   rm -rf public/ && hugo --minify
   ```
   - Must complete without errors
   - Generated site should be in `public/` directory

2. **Development server validation**:
   ```bash
   hugo server --bind 0.0.0.0 --port 1313
   curl -I http://localhost:1313/
   ```
   - Server must start successfully and respond with HTTP 200
   - Test navigation to posts and other sections

3. **Content validation**:
   - Create a test post with `hugo new posts/test.md`
   - Set `draft: false` and add sample content
   - Verify post appears in development server
   - Remove test content when done

4. **Theme CSS validation**:
   - Check that `public/css/eureka.min.*.css` is generated
   - Verify CSS includes Tailwind classes and theme styles
   - Theme uses PostCSS pipeline for CSS processing

### NEVER CANCEL builds or long-running commands:
- Hugo builds: typically 2-3 seconds, set timeout to 30+ seconds
- npm install (theme): typically 10-15 seconds, set timeout to 60+ seconds
- Development server startup: typically 2-3 seconds
- Live reload rebuilds: typically 20-30ms for content changes

### Build performance metrics:
- Clean build: ~1.7 seconds with 47 pages
- Development rebuild: ~20-30ms for content changes
- Image processing: automatic for icons and static images
- CSS/JS minification: included in build time

## Configuration

### Key configuration files:
- `config/_default/config.yaml`: Main Hugo configuration
- `config/_default/params.yaml`: Theme parameters
- `config/_default/menus.yaml`: Navigation menus
- `config/_default/languages.yaml`: Language settings

### Theme configuration:
- **Theme**: Uses local `hugo-eureka` theme (not Hugo modules)
- **CSS Processing**: Requires PostCSS and Tailwind CSS
- **Version**: Hugo Extended v0.122.0 (required for PostCSS support)

### Important notes:
- Site uses local theme instead of Hugo modules due to network restrictions
- Theme requires npm dependencies for CSS processing
- Build artifacts (`public/`, `node_modules/`, `resources/`) are git-ignored

## Common Tasks

### Repository structure:
```
.
├── .github/workflows/hugo.yml    # GitHub Actions deployment
├── config/_default/              # Hugo configuration
├── content/                      # Content files
│   ├── posts/                   # Blog posts
│   ├── docs/                    # Documentation
│   └── authors/                 # Author profiles
├── static/                      # Static files (images, etc.)
├── themes/hugo-eureka/          # Theme files
└── assets/                      # Asset processing
```

### GitHub Actions workflow:
- Automatically builds and deploys to `ruqinga.github.io` on push to main
- Uses Hugo v0.122.0 extended
- Installs Dart Sass and npm dependencies
- Deploys to external repository using personal token

### Content guidelines:
- Posts support Markdown with Hugo shortcodes
- Categories: Linux, RNA-seq, 实验笔记, 微生物组
- Tags for organization and filtering
- Chinese and English content supported
- Code syntax highlighting available (includes Dart language)
- Mathematical expressions may be supported depending on theme configuration
- Draft posts (draft: true) are not published in production builds

### Theme customization:
- Site description: Configured in `config/_default/params.yaml`
- Color scheme: auto, light, or dark modes available
- Syntax highlighting: Uses highlight.js with configurable languages
- Site icon: Located at `static/images/icon.png`
- Publisher info: Configured for person/organization schema

### Troubleshooting:
- **PostCSS errors**: Ensure theme npm dependencies are installed
- **Build failures**: Check Hugo version (must be extended)
- **CSS not loading**: Verify PostCSS and Tailwind are installed
- **Module errors**: Ensure using local theme, not Hugo modules