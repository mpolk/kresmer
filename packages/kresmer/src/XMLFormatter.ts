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
        this.currentIndentLevel = initialIndentLevel ?? 0;
    }//ctor

    private currentIndentLevel: number;
    private lines: [string, number][] = [];
    private tagStack: XMLTag[] = [];

    public indent(): XMLFormatter {this.currentIndentLevel++; return this;}
    public i(): XMLFormatter {return this.indent()}
    public unindent(): XMLFormatter {this.currentIndentLevel--; return this;}
    public u(): XMLFormatter {return this.unindent()}

    public addLine(line: string, indent?: number): XMLFormatter
    {
        this.lines.push([line, indent ?? this.currentIndentLevel]);
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

    public pushTag(tag: XMLTag): XMLFormatter;
    public pushTag(tagName: string, ...attribs: [string, unknown?][]): XMLFormatter;
    public pushTag(tag: string|XMLTag, ...attribs: [string, unknown?][]): XMLFormatter
    {
        if (!(tag instanceof XMLTag))
            tag = new XMLTag(tag, ...attribs);
        this.tagStack.push(tag);
        this.addLine(tag.opening());
        this.indent();
        return this;
    }//pushTag

    public popTag()
    {
        console.assert(this.tagStack.length > 0);
        this.unindent();
        this.addLine(this.tagStack.pop()!.closing());
        return this;
    }//popTag

    public get xml()
    {
        return this.lines.map(([line, indent]) => `${' '.repeat(indent * 4)}${line}`).join("\n");
    }//xml
}//XMLFormatter


export class XMLTag {
    constructor(readonly tagName: string, ...attribs: [string, unknown?][])
    {
        this.attribs = attribs.map(([name, value]) => [name, value]);
    }//ctor

    private attribs: [string, unknown][];

    private attribStr(formatting?: XMLTagFormatting)
    {
        return this.attribs.map(([name, value]) => ` ${name}="${value ?? ''}"`)
            .join(formatting === XMLTagFormatting.multiline ? "\n   " : "");
    }//attribStr

    public addAttrib(name: string, value?: unknown): XMLTag
    {
        this.attribs.push([name, value]);
        return this;
    }//addAttrib

    public opening(formatting?: XMLTagFormatting)
    {
        return `<${this.tagName}${this.attribStr(formatting)}>`;
    }//opening

    public selfClosing(formatting?: XMLTagFormatting)
    {
        return `<${this.tagName}${this.attribStr(formatting)}/>`;
    }//opening

    public closing()
    {
        return `</${this.tagName}>`;
    }//closing
}//XMLTag


export const enum XMLTagFormatting {
    inline = "inline",
    multiline = "multiline",
}//XMLTagFormatting