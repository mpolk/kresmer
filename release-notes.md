# Release Notes

## 0.17.4

Fix selection of the correct library element version when processing multiple overlapping libraries

## 0.17.3

- Minor improvement and focus behavior fix in adding a new subprop in the editor
- Switch off drawing area selection with left clicks by default

## 0.17.2

Fixing and improving areas appearance and behavior

## 0.17.1

- Improve reloading the drawing from fresh with ctrl-R: now the last opened drawing is restored
- Fix in link-end vertex alignment procedure
- Fix: avoid premature mouse release when dragging drawing elements

## 0.17.0

One more kind of the drawing element introduced: *drawing areas* (or just *areas*). These are free-form shapes (closed paths), living on the lowest drawing layer. Areas can be used to represent urban development elements (streets, squares, parks, etc.), terrain elements (rivers, fields, forests) on topographic maps, or simply large parts of regular drawings.

## 0.16.6

Yet one more "private" release. Drawing areas implementation in progress.

## 0.16.5

One more "private" release. Fixed an error in library data priority handling.

## 0.16.3

One more "private" release. Electron app also renamed from "e-kresmer" to just "kresmer".

## 0.16.2

Another "private" release. Linux packages renamed from "e-kresmer" to just "kresmer".

## 0.16.1

This is a "private" release, which is not intended to be published. It contains a breaking change (see below), which will be published with the next quasi-major release (0.17) together with the Drawing Areas implementation.

- ***Breaking change***: The format of the link objects in the drawing (.kre) files changed. Now ```<vertex>``` tags are not scattered directly in the ```<link>``` container, but are grouped in the ```<vertices>``` container element. Kresmer still accepts the old format, but the drawings saved with the version will be read incorrectly by the previous versions (all inner vertices will be lost).

- Drawing Areas implementation in progress

- "Library data priority" switch, which determines the choice between the system-provided library element and the similar embedded one when both exists, is now actually implemented.

## 0.16.0

Now Kresmer core-component can connect to the backend server and load the libraries and the drawing upon construction if the corresponding initialization parameters are provided, i.e.:

```typescript
new Kresmer("#mountPoint", {
    backendServerURL: url, backendServerPassword: password, 
    libData: {stdlib: stdlibXML, lib1: lib1XML},
    drawingData: drawingXML,
})
```

## 0.15.3

- Fixed an error in SVG exporting, which made exported SVG-files unreadable by some SVG-manipulating software because of wrong XML-namespace usage. The error was introduced in the 0.15.0 release, where the whole XML-namespace hierarchy was reorganized.

- A boolean prop called ```mirrorLabels``` was added to all types of links. It helps a resolve a problem when a start or end link label rendered upside-down because of the orientation of the corresponding link end (or start). Previously the only solution was to
exchange the link's start and end points. It might be rather inconvenient, especially when the link had many intermediate vertices and you had to move them all. Now you can just set ```mirrorLabels``` to ```true```, and the labels will be mirrored relative to the link path.

## 0.15.0

Now Kresmer may be used as a regular Vue component: either top-most (i.e. ```createApp(KresmerVue, {...}).mount("#kresmer")```) or embedded it into some other Vue component/application. To enable this capability and prevent the outer namespace pollution and name collisions, several breaking changes have been made.

Kresmer built-in elements and template functions were renamed:

- Kresmer built-in elements:
  - **connection-point** &rArr; **kre:connection-point**
  - **connection-indicator** &rArr; **kre:connection-indicator**
  - **adjustment-ruler** &rArr; **kre:adjustment-ruler**

- Kresmer built-in template functions:
  - **$streetAddress()** &rArr; **kre$streetAddress()**
  - **$openURL()** &rArr; **kre$openURL()**
  - **$href()** &rArr; **kre$href()**
  - **$scale()** &rArr; **kre$scale()**
  - **$portName()** &rArr; **kre$portName()**
  - **$ThreeVectorTransform()** &rArr; **kre$threeVectorTransform()**
  - **$p()** &rArr; **kre$p()**

This required in its turn to introduce some new namespaces to the Kresmer drawing and library XML-format.
Because of these changes libraries made for the previous releases of Kresmer cannot be used with this version.
And conversely the older Kresmer, cannot use the newer libs. Of course, libraries supplied with Kresmer are
renewed, but if you have self-made libraries, you have to update them manually, using change-lists above.

The embedded libs in the drawing saved with the previous version of Kresmer are also incompatible with the
current app and component. But you may update them simply opening and then saving with the latest Kresmer app.
