/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import Kresmer from "../Kresmer";
import KresmerException from "../KresmerException";
import NetworkLinkClass from "./NetworkLinkClass";
import LinkVertex, { LinkVertexInitParams } from "./LinkVertex";
import NetworkElement from '../NetworkElement';
import { EditorOperation } from "../UndoStack";
import { Position } from "../Transform/Transform";

/**
 * Network Component - a generic network element instance 
 */
export default class NetworkLink extends NetworkElement {
    /**
     * 
     * @param _class The class this Link should belong 
     *               (either Link class instance or its name)
     * @param args Instance creation arguments:
     *             props: translates to the vue-component props
     */
    public constructor(
        kresmer: Kresmer,
        _class: NetworkLinkClass | string,
        args?: {
            name?: string,
            props?: Record<string, unknown>,
            from?: LinkVertexInitParams,
            to?: LinkVertexInitParams,
            vertices?: LinkVertexInitParams[],
        }
    ) {
        super(kresmer, _class instanceof NetworkLinkClass ? _class : NetworkLinkClass.getClass(_class), args);
        let i = 0;
        this.vertices.push(new LinkVertex(this, i++, args?.from));
        args?.vertices?.forEach(initParams => this.vertices.push(new LinkVertex(this, i++, initParams)));
        this.vertices.push(new LinkVertex(this, i++, args?.to));
    }//ctor

    public zIndex = -1;
    private savedZIndex = -1;
    private verticesInitialized = false;
    vertices: LinkVertex[] = [];

    readonly initVertices = () => {
        this.vertices.forEach(vertex => vertex.init());
        this.verticesInitialized = true;
    }//initVertices

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<NetworkLink>;

    override getDefaultName()
    {
        return `Link${this.id}`;
    }//getDefaultName

    toString()
    {
        let str = `${this.name}: ${this.getClass().name}`;
        if (this.verticesInitialized) {
            str += ` (${this.vertices[0]} => ${this.vertices[this.vertices.length - 1]})`;
        }//if
        return str;
    }//toString

    public selectLink()
    {
        if (!this.isSelected) {
            this.kresmer.deselectAllElements(this);
            this.isSelected = true;
        }//if
    }//selectComponent

    override get isSelected() {return this._isSelected}
    override set isSelected(reallyIs: boolean) {
        const shouldNotify = reallyIs != this.isSelected;
        this._isSelected = reallyIs;
        if (shouldNotify) {
            this.kresmer.emit("link-selected", this, this.isSelected);
        }//if
    }//isSelected

    public bringToTop()
    {
        if (this.zIndex < Number.MAX_SAFE_INTEGER) {
            this.savedZIndex = this.zIndex;
            this.zIndex = Number.MAX_SAFE_INTEGER;
        }//if
    }//bringToTop

    public restoreZPosition()
    {
        this.zIndex = this.savedZIndex;
    }//restoreZPosition


    public addVertex(segmentNumber: number, mousePos: Position)
    {
        console.debug(`Add vertex: ${this.name}:${segmentNumber} (${mousePos.x}, ${mousePos.y})`);
        const vertexNumber = segmentNumber + 1;
        const pos = this.kresmer.applyScreenCTM(mousePos);
        const vertex = new LinkVertex(this, vertexNumber, {pos}).init();
        this.kresmer.undoStack.execAndCommit(new AddVertexOp(vertex));
    }//addVertex


    public deleteVertex(vertexNumber: number) {
        if (this.vertices.length <= vertexNumber) {
            throw new KresmerException(`Attempt to delete a non-existent vertex (${this.id}, ${vertexNumber})`);
        }//if
        if (this.vertices.length <= 2) {
            console.info(`Attempt to delete the next-to-last vertex (${this.id}, ${vertexNumber})`);
            return false;
        }//if
        this.kresmer.undoStack.execAndCommit(new DeleteVertexOp(this.vertices[vertexNumber]));
        return true;
    }//deleteVertex


    public alignVertex(vertexNumber: number)
    {
        return this.vertices[vertexNumber].align();
    }//alignVertex


    public onRightClick(segmentNumber: number, event: MouseEvent)
    {
        this.selectLink();
        this.kresmer.emit("link-right-click", this, segmentNumber, event);
    }//onRightClick

}//NetworkLink


// Editor operations

class AddVertexOp extends EditorOperation {
    protected vertex: LinkVertex;

    constructor(vertex: LinkVertex)
    {
        super();
        this.vertex = vertex;
    }//ctor

    exec() {
        const link = this.vertex.link;
        const vertexNumber = this.vertex.vertexNumber;
        link.vertices.splice(vertexNumber, 0, this.vertex);
        for (let i = vertexNumber + 1; i < link.vertices.length; i++) {
            link.vertices[i].vertexNumber = i;
        }//for
    }//exec

    undo() {
        const link = this.vertex.link;
        const vertexNumber = this.vertex.vertexNumber;
        link.vertices.splice(vertexNumber, 1);
        for (let i = vertexNumber; i < link.vertices.length; i++) {
            link.vertices[i].vertexNumber = i;
        }//for
    }//undo
}//AddVertexOp

class DeleteVertexOp extends AddVertexOp {
    exec() {
        super.undo();
    }//exec

    undo() {
        super.exec();
    }//undo
}//DeleteVertexOp