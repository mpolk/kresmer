# "Kreslennya Merezh" - network diagram editor and viewer
## Core component

![screenshot](./src/assets/screenshot.jpg)

## Get Started

1. ### Install the component

    ```bash
    npm install kresmer
    ```

1. ### Import it into your application

    ```typescript
    import Kresmer from 'kresmer';
    ```

1. ### Place it on the page

    ```typescript
    const kresmer = new Kresmer("divDrawing");
    ```
1. ### Load the standard element library
    ```typescript
    kresmer.loadLibrary(await (await fetch("stdlib.krel")).text());
1. ### Load some drawing
    ```typescript
    kresmer.loadDrawing(await (await fetch("autoload.kre")).text());
    