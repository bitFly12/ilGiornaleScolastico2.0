# Logo Setup Guide - Giornale Cesaris

This guide explains how to add and display the site logo near the site name in the header.

## Current State

Currently, the site uses an emoji icon (📰) as a placeholder logo:

```html
<a href="index.html" class="logo">
    <span class="logo-icon">📰</span>
    <span>Giornale Cesaris</span>
</a>
```

## Option 1: Add SVG Logo (Recommended)

### Step 1: Prepare Your Logo

1. Create or obtain an SVG version of your logo
2. Recommended size: 40x40 pixels or scalable
3. Save as `logo.svg`

### Step 2: Add Logo to Project

Place the logo file in the `assets/` or `images/` directory:

```bash
# Create directory if it doesn't exist
mkdir -p assets/images

# Place your logo file
# assets/images/logo.svg
```

### Step 3: Update HTML Files

Replace the emoji icon with your SVG logo in all HTML files. 

**Files to update:**
- `index.html`
- `articoli.html`
- `articolo.html`
- `chat.html`
- `profilo.html`
- `admin.html`
- `candidatura.html`
- `badges.html`
- `contact.html`
- `manutenzione.html`
- And any other pages with a header

**Old code:**
```html
<a href="index.html" class="logo">
    <span class="logo-icon">📰</span>
    <span>Giornale Cesaris</span>
</a>
```

**New code:**
```html
<a href="index.html" class="logo">
    <img src="assets/images/logo.svg" alt="Logo Cesaris" class="logo-image">
    <span>Giornale Cesaris</span>
</a>
```

### Step 4: Add CSS Styling

Add this CSS to your `css/style.css` file (or in the `<style>` section if inline):

```css
.logo-image {
    height: 40px;
    width: auto;
    margin-right: 0.5rem;
    vertical-align: middle;
}

/* Responsive logo for mobile */
@media (max-width: 768px) {
    .logo-image {
        height: 32px;
    }
}
```

## Option 2: Use Base64 Encoded SVG

If you don't want to create a separate file, you can embed the SVG directly:

```html
<a href="index.html" class="logo">
    <img src="data:image/svg+xml;base64,YOUR_BASE64_ENCODED_SVG_HERE" 
         alt="Logo Cesaris" class="logo-image">
    <span>Giornale Cesaris</span>
</a>
```

To convert your SVG to base64:

**Online Tool:**
- Go to https://base64.guru/converter/encode/image
- Upload your SVG
- Copy the base64 string

**Command Line (Linux/Mac):**
```bash
base64 -w 0 logo.svg
```

## Option 3: Use PNG Logo

If you prefer a PNG logo:

### Step 1: Prepare Logo

1. Create a high-resolution PNG (at least 80x80 px for retina displays)
2. Optimize it using tools like TinyPNG
3. Save as `logo.png` and `logo@2x.png` (for retina)

### Step 2: Add to Project

```bash
assets/images/logo.png
assets/images/logo@2x.png
```

### Step 3: Update HTML

```html
<a href="index.html" class="logo">
    <img src="assets/images/logo.png" 
         srcset="assets/images/logo.png 1x, assets/images/logo@2x.png 2x"
         alt="Logo Cesaris" class="logo-image">
    <span>Giornale Cesaris</span>
</a>
```

## Option 4: Keep Emoji but Use a Better One

If you want to keep using emojis, you can use a more school-specific one:

```html
<!-- Options -->
<span class="logo-icon">📚</span>  <!-- Book -->
<span class="logo-icon">🎓</span>  <!-- Graduation cap -->
<span class="logo-icon">✍️</span>  <!-- Writing hand -->
<span class="logo-icon">📖</span>  <!-- Open book -->
```

## Advanced: Dynamic Logo Based on Theme

If your site has dark/light themes:

### CSS Approach:

```css
.logo-image {
    height: 40px;
    width: auto;
    margin-right: 0.5rem;
}

/* Show light logo on dark theme */
[data-theme="dark"] .logo-image {
    filter: brightness(0) invert(1);
}
```

### HTML Approach:

```html
<a href="index.html" class="logo">
    <picture>
        <source srcset="assets/images/logo-dark.svg" media="(prefers-color-scheme: dark)">
        <img src="assets/images/logo-light.svg" alt="Logo Cesaris" class="logo-image">
    </picture>
    <span>Giornale Cesaris</span>
</a>
```

## Quick Replace Script

To quickly replace the logo in all files, use this bash script:

```bash
#!/bin/bash
# replace-logo.sh

OLD='<span class="logo-icon">📰</span>'
NEW='<img src="assets/images/logo.svg" alt="Logo Cesaris" class="logo-image">'

# Replace in all HTML files
find . -name "*.html" -type f -exec sed -i "s|$OLD|$NEW|g" {} \;

echo "Logo replaced in all HTML files!"
```

Run it:
```bash
chmod +x replace-logo.sh
./replace-logo.sh
```

## Verification Checklist

After adding your logo, verify:

- [ ] Logo displays correctly on desktop
- [ ] Logo displays correctly on mobile
- [ ] Logo scales properly on different screen sizes
- [ ] Logo has good contrast on your header background
- [ ] Logo is aligned properly with the site name
- [ ] Logo loads quickly (file size < 50KB)
- [ ] Logo works on all pages (index, articles, admin, etc.)
- [ ] Logo is accessible (has alt text)

## Troubleshooting

### Logo not showing

**Check:**
1. File path is correct (relative to HTML file)
2. File exists in the specified location
3. File permissions allow reading
4. Browser cache (try Ctrl+F5)

### Logo too large/small

**Solution:**
Adjust the CSS height property:
```css
.logo-image {
    height: 32px; /* Decrease for smaller */
    height: 48px; /* Increase for larger */
}
```

### Logo looks pixelated

**Solution:**
1. Use SVG instead of PNG/JPG
2. If using PNG, provide @2x retina version
3. Increase the source image resolution

### Logo misaligned with text

**Solution:**
Add vertical alignment:
```css
.logo-image {
    height: 40px;
    width: auto;
    margin-right: 0.5rem;
    vertical-align: middle;
    position: relative;
    top: -2px; /* Adjust as needed */
}
```

## Example: Current Logo in admin.html

Looking at the existing code in `admin.html` and `manutenzione.html`, they use an SVG embedded as base64:

```html
<img src="data:image/svg+xml;base64,PD94bWw..." alt="Logo Cesaris" style="height: 40px; width: auto; margin-right: 0.5rem;">
```

This is a good approach - you can decode the current base64, customize the SVG, and re-encode it for your own logo.

## Resources

- **SVG Editors**: Inkscape, Adobe Illustrator, Figma
- **SVG Optimization**: SVGOMG (https://jakearchibald.github.io/svgomg/)
- **PNG Optimization**: TinyPNG (https://tinypng.com)
- **Base64 Encoder**: Base64 Guru (https://base64.guru)

## Support

For help with logo implementation:
- Email: mohamed.mashaal@cesaris.edu.it
- Include screenshots of your logo and current header
- Mention which option you're trying to implement
