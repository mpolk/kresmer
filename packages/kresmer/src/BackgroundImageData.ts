/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *           A data object for the drawing background image
\**************************************************************************/

export class BackgroundImageData {
    url: string = "";
    view = BackgroundImageView.STRECH;
    visibility = 1.0;

    constructor(anotherImage?: BackgroundImageData | 
                               {
                                   url?: string | null,
                                   view?: BackgroundImageView | null,
                                   visibility?: number | null,
                               }
    ) {
        if (anotherImage) {
            this.url = anotherImage.url ?? "";
            this.view = anotherImage.view ?? BackgroundImageView.STRECH;
            this.visibility = anotherImage.visibility ?? 1;
        } //if
    } //ctor

    copy(anotherImage: BackgroundImageData) {
        this.url = anotherImage.url;
        this.view = anotherImage.view;
        this.visibility = anotherImage.visibility;
    } //copy

    get isEmpty() { return !this.url; }
    get nonEmpty() { return Boolean(this.url); }

    cssAttr() {
        if (!this.url)
            return {};

        const backgroundImage = `url(${this.url})`;
        const { backgroundSize, backgroundPosition, backgroundRepeat } = 
            this.view === "tile" ?   { backgroundSize: "auto",      backgroundPosition: undefined, backgroundRepeat: "repeat" } :
            this.view === "center" ? { backgroundSize: "auto",      backgroundPosition: "center",  backgroundRepeat: "no-repeat" } :
            this.view === "scale" ?  { backgroundSize: "contain",   backgroundPosition: "center",  backgroundRepeat: "no-repeat" } :
            this.view === "cover" ?  { backgroundSize: "cover",     backgroundPosition: undefined, backgroundRepeat: "no-repeat" } :
                                     { backgroundSize: "100% 100%", backgroundPosition: undefined, backgroundRepeat: "no-repeat" };
        return { backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat };
    } //cssAttrs

    toXML()
    {
        if (!this.url)
            return "";

        return `background-image="${this.url}" background-image-view="${this.view}" background-image-visibility="${this.visibility}"`;
    }//toXML

} //BackgroundImageData

export enum BackgroundImageView {
    STRECH = "stretch",
    COVER = "cover",
    SCALE = "scale",
    CENTER = "center",
    TILE = "tile"
} //BackgroundImageView
