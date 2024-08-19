## 0.15.3

- Fixed an error in SVG exporting, which made exported SVG-files unreadable by some SVG-manipulating software because of wrong XML-namespace usage. The error was introduced in the 0.15.0 release, where the whole XML-namespace hierarchy was reorganized.

- A boolean prop called ```mirrorLabels``` was added to all types of links. It helps a resolve a problem when a start or end link label rendered upside-down because of the orientation of the corresponding link end (or start). Previously the only solution was to 
exchange the link's start and end points. It might be rather inconvenient, especially when the link had many intermediate vertices and you had to move them all. Now you can just set ```mirrorLabels``` to ```true```, and the labels will be mirrored relative to the link path.

## 0.15.0

Now Kresmer may be used as a regular Vue component: either top-most (i.e. ```createApp(KresmerVue, {...}).mount("#kresmer")```) 
or embedded it into some other Vue component/application. 
To enable this capability and prevent the outer namespace pollution and name collisions, several breaking changes have been made. 

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
