# Security policy

## Supported versions

Security fixes are made on the latest 1.x release of `@stacklogs/vue-draggable` and
`@stacklogs/nuxt-draggable`.

## Reporting a vulnerability

Please **do not open a public issue**. Report privately using GitHub's "Report a vulnerability"
feature on the repository's Security tab, or email **thinnd.work@gmail.com** with the subject
`vue-draggable security`.

Include the package and version, a minimal reproduction, and the impact you expect. You will get an
acknowledgement and a fix or mitigation plan; coordinated disclosure is appreciated.

## Security properties and limits

- **One runtime dependency (the drag engine) and no install scripts.** Development dependencies are
  not published. Releases made from GitHub Actions carry an npm provenance statement.
- **No HTML from data.** Items are rendered by your `item` slot through Vue's normal escaping; the
  component never sets `innerHTML`. What your slot renders is your responsibility.
- **Server-side rendering:** importing the packages on the server touches no browser globals, and the
  Nuxt module keeps the drag engine out of the server bundle.
- **Drag data stays in the page.** Dragging between lists moves references inside your app; nothing
  is written to the clipboard or sent over the network. Native drag and drop may expose the dragged
  element's text to other windows through the browser's drag data, as any draggable element does.
- **Undo history** (`useDraggableHistory`) keeps references to your items in memory, up to
  `capacity` steps (100 by default); call `clear()` when items must be released.
