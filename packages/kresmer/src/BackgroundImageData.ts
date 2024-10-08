/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *           A data object for the drawing background image
\**************************************************************************/

export class BackgroundImageData {
    url: string = "";
    alignment = BackgroundImageAlignment.STRETCH;
    visibility = 1.0;

    constructor(anotherImage?: BackgroundImageData | BackgroundImageRawData) 
    {
        if (anotherImage) {
            this.url = anotherImage.url ?? "";
            this.alignment = anotherImage.alignment ?? BackgroundImageAlignment.STRETCH;
            this.visibility = anotherImage.visibility ?? 1;
        } //if
    } //ctor

    copy(anotherImage: BackgroundImageData) {
        this.url = anotherImage.url;
        this.alignment = anotherImage.alignment;
        this.visibility = anotherImage.visibility;
    } //copy

    get isEmpty() { return !this.url; }
    get nonEmpty() { return Boolean(this.url); }

    cssAttr() {
        if (!this.url)
            return {};

        const backgroundImage = `url(${this.url})`;
        const { backgroundSize, backgroundPosition, backgroundRepeat } = 
            this.alignment === "tile" ?   { backgroundSize: "auto",      backgroundPosition: undefined, backgroundRepeat: "repeat" } :
            this.alignment === "center" ? { backgroundSize: "auto",      backgroundPosition: "center",  backgroundRepeat: "no-repeat" } :
            this.alignment === "scale" ?  { backgroundSize: "contain",   backgroundPosition: "center",  backgroundRepeat: "no-repeat" } :
            this.alignment === "cover" ?  { backgroundSize: "cover",     backgroundPosition: undefined, backgroundRepeat: "no-repeat" } :
                                     { backgroundSize: "100% 100%", backgroundPosition: undefined, backgroundRepeat: "no-repeat" };
        return { backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat };
    } //cssAttrs

    toMarkupAttrs(): Record<string, unknown>
    {
        if (this.isEmpty)
            return {};

        return {
            "background-image": this.url, 
            "background-image-alignment": this.alignment,
            "background-image-visibility": this.visibility,
        }
    }//toMarkupAttrs

} //BackgroundImageData

interface IBackgroundImageRawData extends BackgroundImageData {}
export type BackgroundImageRawData = Partial<IBackgroundImageRawData>;

export enum BackgroundImageAlignment {
    STRETCH = "stretch",
    COVER = "cover",
    SCALE = "scale",
    CENTER = "center",
    TILE = "tile"
} //BackgroundImageAlignment
