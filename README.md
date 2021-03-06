# [Web Journal](//lmmarsano.github.io/journal/)

Personal journal on coding.
Designed with accessibility in mind.
Built in language preprocessors ([pug](//pugjs.org), [PostCSS](//postcss.org/) with [SugarSS](//github.com/postcss/sugarss) parser) to keep it <abbr title='don’t repeat yourself'>DRY</abbr>.

## Custom CSS

[views/style/style.sss](views/style/style.sss) contains all CSS.

### Uniform Colors & Lengths

The `:root` rule-set declares [custom properties](//www.w3.org/TR/css-variables-1/) for colors & margin/padding lengths used throughout.
The colors meet [WCAG color contrast standards](//www.w3.org/TR/WCAG20/#visual-audio-contrast).

### Class/ID Selectors

- `.scripting-`{`available`, `unavailable`, `required`, `prohibited`}
  1. together, these implement progressive enhancement
	 - a script replaces class `scripting-available` with `scripting-unavailable` in the `body` element
	 - this switches the `display` for `.scripting-required` and `.scripting-prohibited` elements
- `.visuallyhidden`
  1. conceal assistive content (eg, replicas of visual-only content) from sight
- `.container`
  1. wraps section content to
	 - allow section to horizontally fill the page
	 - adaptively center & pad content
- `.banner`
  1. inverts colors for contrast
  2. pads & centers
- `.logo`
  1. rounds picture
- `.articles`
  1. pad footer links, outline, center
  2. adaptively size & position children
- `.title`
  1. enlarge, bolden, decorate title
- `.numerical-data`
  1. aligns numbers right

## Custom JavaScript Functions

All `.js` files under [views](views) are custom.
[views/script](views/script) features reused, custom code, namely

- [views/script/euclidean.js](views/script/euclidean.js)
  1. is a custom library
  2. defines & exports 3 classes (which are functions)
  3. one of which is iterable (implements a generator function with `for` iteration)
- [views/script/code-brush.js](views/script/code-brush.js)
  1. imports and customizes a library
- [views/script/form-validation.js](views/script/form-validation.js)
  1. defines reportValidity polyfill
  2. defines functions to integrate the Constraint API with ARIA error reporting
- [views/script/dom-menu.js](views/script/dom-menu.js)
  1. define accessible fly-out menus through aria-expanded attribute
- [views/script/dom-utility.js](views/script/dom-utility.js)
  1. defines & exports convenience functions for DOM manipulation
- [views/script/dom-polyfill.js](views/script/dom-polyfill.js)
  1. defines a polyfill for replacing tokens
- [views/script/script.js](views/script/script.js)
  1. defines an onSubmit function used to cancel all form submissions (no backend)

Scripts directly under [views](views) feature page-specific code.

- [views/euclidean-algorithm.js](views/euclidean-algorithm.js) implements
  1. a class to manage the form and response
  2. custom form validation integrated with the native [Constraint Validation API](//html.spec.whatwg.org/dev/form-control-infrastructure.html#constraints) & [ARIA](//www.w3.org/TR/wai-aria-1.1/)
	 - tested against [ChromeVox](//chrome.google.com/webstore/detail/chromevox/kgejglhpjiefppelpmljglcjbhoiplfn)

## Comments

Refer to the preprocessed files under [views](views).
Processed files under [docs](docs) strip them, though they may be visible under source maps.

## Development

- make sure [node.js](//nodejs.org/) is version ≥ `6`
- in your terminal, do the following or the equivalent

  ```shell
  git clone https://github.com/lmmarsano/journal.git
  cd journal
  npm install
  ```

- run the development server `npm start`
- alternatively, build `npm run build-dev` and run your own server under the build root `docs`, eg
  ```shell
  cd docs
  python3 -m http.server
  www-browser http://localhost:8000/
  ```
- edit sources under `views`
