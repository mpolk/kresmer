## 0.15.0

Now Kresmer may be as a regular Vue component: either top-most (i.e. ```createApp(KresmerVue, {...}).mount("#kresmer")```) 
or embedded it into some other Vue component/application. 
To enable this capability and prevent the outer namespace pollution and name collisions, several breaking changes have been made. 

Kresmer built-in elements and template functions were renamed:

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
