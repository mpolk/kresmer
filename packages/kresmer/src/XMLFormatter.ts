/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *      A helper class for generating pretty formatted XML 
 *      for use in various object serialization
 ***************************************************************************/

export default class XMLFormatter {

    constructor(initialIndentLevel?: number)
    {
        this._currentIndentLevel = initialIndentLevel ?? 0;
    }//ctor

    get currentIndentLevel() {return this._currentIndentLevel}
    private _currentIndentLevel: number;
    private lines: [string, number][] = [];
    private tagStack: XMLTag[] = [];

    public indent(): XMLFormatter {this._currentIndentLevel++; return this;}
    public i(): XMLFormatter {return this.indent()}
    public unindent(): XMLFormatter {this._currentIndentLevel--; return this;}
    public u(): XMLFormatter {return this.unindent()}

    public indentation(indentDelta: number = 0)
    {
        return ' '.repeat(4 * (this._currentIndentLevel + indentDelta));
    }//indentation

    public addLine(line?: string, indent?: number): XMLFormatter
    {
        this.lines.push([line ?? "", line ? this._currentIndentLevel + (indent ?? 0) : 0]);
        return this;
    }//addLine

    public addLines(...lines: ([string, number?] | string)[]): XMLFormatter
    {
        for (const l of lines) {
            if (Array.isArray(l))
                this.addLine(l[0], l[1]);
            else
                this.addLine(l);
        }//for
        return this;
    }//addLines

    public append(anotherFormatter: XMLFormatter): XMLFormatter
    {
        this.lines.push(...anotherFormatter.lines);
        return this;
    }//append

    public addTag(tag: XMLTag): XMLFormatter;
    public addTag(tagName: string, ...attribs: ([string, unknown?]|string)[]): XMLFormatter;
    public addTag(tag: string|XMLTag, ...attribs: ([string, unknown?]|string)[]): XMLFormatter
    {
        if (!(tag instanceof XMLTag))
            tag = new XMLTag(tag, ...attribs);
        this.addLine(tag.selfClosing());
        return this;
    }//addTag

    public pushTag(tag: XMLTag): XMLFormatter;
    public pushTag(tagName: string, ...attribs: ([string, unknown?]|string)[]): XMLFormatter;
    public pushTag(tag: string|XMLTag, ...attribs: ([string, unknown?]|string)[]): XMLFormatter
    {
        if (!(tag instanceof XMLTag))
            tag = new XMLTag(tag, ...attribs);
        this.tagStack.push(tag);
        this.addLine(tag.opening());
        tag.outputPositionMark = this.lines.length;
        this.indent();
        return this;
    }//pushTag

    public popTag()
    {
        console.assert(this.tagStack.length > 0);
        this.unindent();
        const tag = this.tagStack.pop()!;
        if (tag.outputPositionMark !== this.lines.length  || tag.hasAttribs) {
            this.addLine(tag.closing());
        } else {
            this.lines.pop();
        }//if
        return this;
    }//popTag

    public get xml()
    {
        return this.lines.map(([line, indent]) => `${' '.repeat(indent * 4)}${line}`).join("\n");
    }//xml
}//XMLFormatter


export class XMLTag {
    constructor(readonly tagName: string, ...attribs: ([string, unknown?]|string)[])
    {
        this.attribs = attribs;
    }//ctor

    public outputPositionMark: number|undefined;
    private attribs: ([string, unknown?]|string)[];

    get hasAttribs() {return Boolean(this.attribs.length);}

    private attribSeparator = " ";
    public setAttribSeparator(newSep: string)
    {
        this.attribSeparator = newSep;
        return this;
    }//setAttribSeparator

    private attribStr(sep?: string)
    {
        if (this.attribs.length === 0)
            return "";

        const s = this.attribs.map(attr => {
            if (!Array.isArray(attr))
                return attr;
            else {
                const [name, value] = attr;
                return `${name}="${value ?? ''}"`
            }//if
        }).join(sep ?? this.attribSeparator);

        return " " + s;
    }//attribStr

    public addAttrib(name: string, value?: unknown): XMLTag
    {
        this.attribs.push([name, value]);
        return this;
    }//addAttrib

    public opening(sep?: string)
    {
        return `<${this.tagName}${this.attribStr(sep)}>`;
    }//opening

    public selfClosing(sep?: string)
    {
        return `<${this.tagName}${this.attribStr(sep)}/>`;
    }//opening

    public closing()
    {
        return `</${this.tagName}>`;
    }//closing
}//XMLTag
