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

    public indent() {this.currentIndentLevel++}
    public i() {this.indent()}
    public unindent() {this.currentIndentLevel--}
    public u() {this.unindent()}

    public addLine(line: string, indent?: number)
    {
        this.lines.push([line, indent ?? this.currentIndentLevel]);
    }//addLine

    public addLines(...lines: ([string, number?] | string)[])
    {
        for (const l of lines) {
            if (Array.isArray(l))
                this.addLine(l[0], l[1]);
            else
                this.addLine(l);
        }//for
    }//addLines

    public append(anotherFormatter: XMLFormatter)
    {
        this.lines.push(...anotherFormatter.lines);
    }//append

    public pushTag(tag: XMLTag): void;
    public pushTag(tagName: string, ...attribs: [string, unknown?][]): void;
    public pushTag(tag: string|XMLTag, ...attribs: [string, unknown?][]): void
    {
        if (!(tag instanceof XMLTag))
            tag = new XMLTag(tag, ...attribs);
        this.tagStack.push(tag);
        this.addLine(tag.xml);
        this.indent();
    }//pushTag

    public popTag()
    {
        console.assert(this.tagStack.length > 0);
        this.unindent();
        this.addLine(this.tagStack.pop()!.closing);
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

    public addAttrib(name: string, value?: unknown)
    {
        this.attribs.push([name, value]);
    }//addAttrib

    public get xml()
    {
        return `<${this.tagName}${this.attribs.map(([name, value]) => ` ${name}="${value ?? ''}"`).join('')}>`
    }//xml

    public get closing()
    {
        return `</${this.tagName}>`;
    }//closing
}//XMLTag