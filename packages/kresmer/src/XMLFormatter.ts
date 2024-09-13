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

    public indent() {this.currentIndentLevel++}
    public i() {this.indent()}
    public unindent() {this.currentIndentLevel--}
    public u() {this.unindent()}

    public addLine(line: string, indent?: number)
    {
        this.lines.push([line, indent ?? this.currentIndentLevel]);
    }//addLine

    public addLines(...lines: [string, number?][])
    {
        for (const [line, indent] of lines) {
            this.addLine(line, indent);
        }//for
    }//addLines

    public append(anotherFormatter: XMLFormatter)
    {
        this.lines.push(...anotherFormatter.lines);
    }//append

    public get xml()
    {
        return this.lines.map(([line, indent]) => `${' '.repeat(indent * 4)}${line}`).join("\n");
    }//xml
}//XMLFormatter


export class XMLTag {
    constructor(readonly tag: string, ...attribs: [string, unknown?][])
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
        return `<${this.tag}${this.attribs.map(([name, value]) => ` ${name}="${value ?? ''}"`).join('')}>`
    }//xml

    public get closing()
    {
        return `</${this.tag}>`;
    }//closing
}//XMLTag