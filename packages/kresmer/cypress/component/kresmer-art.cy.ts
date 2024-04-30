/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing DrawingArea creation and basic functionality
 ***************************************************************************/

import Kresmer from "Kresmer";
import NetworkComponentClass from "../../src/NetworkComponent/NetworkComponentClass";
import NetworkComponent from "../../src/NetworkComponent/NetworkComponent";

describe('Kresmer Art', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            console.debug(_kresmer.drawingName);
            kresmer = _kresmer;
        });
    });

    it('loads a "Kresmer Art" drawing', () => {
        cy.readFile("../../kresmer-art.kre").then(async (drawingData) => {
            await kresmer.loadDrawing(drawingData);
            kresmer
                .registerNetworkComponentClass(new NetworkComponentClass("GoldenKresmer", {
                    template: `
                        <rect x="0" y="0" :width="width" :height="height" 
                                stroke="gold" stroke-width="8px" stroke-opacity="0.5"/>
                        <text :x="width*0.25" :y="height*0.6" stroke="gold" :font-size="fontSize">{{text}}</text>
                        <Kre:Crown  x="10" v-bind:y="height*0.6" v-bind:font-size="fontSize"/>
                        <text :x="width*0.95" :y="height*0.6" fill="gold" :font-size="fontSize" text-anchor="end">
                        <template v-for="i in 3">⚜</template></text>
                    `,
                    props: {
                        width: {type: Number, required: true},
                        height: {type: Number, required: true},
                        fill: {type: String, default: "yellow"},
                        text: {type: String},
                        fontSize: {type: String},
                    },
                }))
                .placeNetworkComponent(new NetworkComponent(kresmer, "GoldenKresmer", {
                        props: {
                            width: 550,
                            height: 50,
                            text: "Golden Kresmer",
                            fontSize: "32"
                        }
                    }), 
                    {x: 100, y: 50}
                )
        });

        cy.get("svg.GoldenKresmer").should("exist");
        cy.get("svg.SilverKresmer").should("exist");
    });

    it('shows a grid', function() {
        kresmer.showGrid = true;
        cy.get("line.grid").should("exist");
    });

    it('shows rulers', function() {
        kresmer.showRulers = true;
        cy.get("rect.axis").should("exist");
        cy.get("line.marking").should("exist");
    });
});