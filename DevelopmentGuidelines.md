# Development guidelines

* Ensure *EVERY* path used is referenced from the `baw.conf` module
 * E.g. Not this
    <a href="/assets/images/demo.jpg">blah blah</a>
  Rather, this:
    <a href="{{configuration.paths.site.assets.images.demo}}">blah blah</a>

# Design guideline

* Do NOT use <a /> elements if there is logical navigation destination
* Avoid using bootstrap classes in the html
 * Instead use SASS to import/extend the appropriate classes in the .scss file
 * Ideally, with appropriate exceptions, design and layout should only occur in css
 * And, semantic structure should only occur in HTML