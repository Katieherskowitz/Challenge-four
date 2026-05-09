## Cursor Cloud specific instructions

This is a static HTML/CSS/JS project with zero external dependencies, no build system, and no package manager.

### Running the application

Serve the project root with any static file server:

```
python3 -m http.server 8080 --directory /workspace
```

Then open `http://localhost:8080/` for the Fortune Teller app or `http://localhost:8080/KATIEHERSKOWITZWEEK6/` for the Mad Libs page.

### Project structure

- `index.html` — Fortune Teller app (inline vanilla JS with Next/Previous/Random buttons)
- `style.css` — Empty stylesheet (available for future use)
- `KATIEHERSKOWITZWEEK6/index.html` — Mad Libs exercise (HTML form inputs, no JS logic)

### Testing / Linting

There are no automated tests, linters, or build steps configured in this project. Manual browser testing is the only verification method.
