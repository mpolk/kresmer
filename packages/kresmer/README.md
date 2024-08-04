# Kresmer - network drawing and diagram editor: the *Core component*

This is [Kresmer][1]'s web-component, implementing all its core functionality.
If you are looking for the **Kresmer** desktop application, this is a wrong place. You can find it [here][1].

The *Kresmer web-component* is used for publishing Kresmer drawings on the web-pages. It is also a core of
the Kresmer desktop application, which is built around the single instance of this component.

[1]: https://github.com/mpolk/kresmer

## Getting Started

To use Kresmer component on your web-page do something like this:

1. ### Install the component

    ```bash
    npm install kresmer
    ```

1. ### Define the place somewhere on the page, where the drawing should be rendered
    ```html
    ...
    <div id="divDrawing" style="width: 100%; height 100%"></div>
    ...
    ```

1. ### Import the component into your application and mount it on the page
    ```typescript
    import Kresmer from 'kresmer';
    const kresmer = new Kresmer("#divDrawing", {logicalWidth: 2000, logicalHeight: 1000, backgroundColor: pink});
    ```
    Actually there are much more optional parameters for initializing Kresmer component. You can learn it and much more 
    Kresmer component API details [here][2]. And 
    *pink* is not a usual background color for the network drawings.


1. ### Load your drawing into the Kresmer
    ```typescript
    kresmer.loadDrawing(await (await fetch("my-drawing.kre")).text());
    ```

Read [Using Kresmer Core Component][2] guide for more details about publishing Kresmer drawings on the web.

[2]: https://github.com/mpolk/kresmer/wiki/Using-Kresmer-Core-Component
