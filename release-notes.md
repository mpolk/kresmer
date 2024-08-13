## 0.15.0

Implemented the ability to use Kresmer as a full-fledged Vue component and embed it into other Vue components/applications. 
To enable this capability, several breaking changes have been made. Kresmer built-in elements and template functions were
renamed to prevent outer namespace pollution and name collisions:

- Kresmer built-in elements:
    - **connection-point** => **kre:connection-point**
    - **connection-indicator** => **kre:connection-indicator**
    - **adjustment-ruler** => **kre:adjustment-ruler**

- Kresmer built-in template functions:
    - **$streetAddress()** => **kre$streetAddress()**
    - **$openURL()** => **kre$openURL()**
    - **$href()** => **kre$href()**
    - **$scale()** => **kre$scale()**
    - **$portName()** => **kre$portName()**
    - **$ThreeVectorTransform()** => **kre$threeVectorTransform()**
    - **$p()** => **kre$p()**
