<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing network elements properties
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "ElementPropsSidebar",
    }
</script>

<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import { NetworkElement, NetworkElementClass, 
             NetworkComponent, NetworkComponentClass, 
             NetworkLink, NetworkLinkClass } from 'kresmer';
    import { kresmer, updateWindowTitle } from './renderer-main';

    let offCanvas: Offcanvas | undefined;
    const rootDiv = ref<HTMLDivElement>();
    const propInputs = ref<HTMLInputElement[]>();
    const formEnabled = ref(false);
    const formValidated = ref(false);

    let elementToEdit: NetworkElement;
    const elementName = ref<string>("");
    const inpElementName = ref<HTMLInputElement>()!;
    watch(elementName, () => {
        formValidated.value = !validateElementName();
    });

    const allClasses = ref<{name: string, _class: NetworkElementClass}[]>([]);
    const elementClass = ref<NetworkElementClass>();

    
    function changeClass() {
        const newClass = elementClass.value!;

        if (elementToEdit instanceof NetworkComponent) {
            if (!confirm(`\
Changing component class will disconnect all links connected to it.
Also, the values of the component properties that absent in the new class will be lost.

Continue?`)) {
                elementClass.value = elementToEdit.getClass();
                return;
            }//if
            kresmer.edAPI.changeComponentClass(elementToEdit, newClass as NetworkComponentClass);
        } else if (elementToEdit instanceof NetworkLink) {
            if (!confirm(`\
Changing link class will disconnect will make the values of the link properties that absent in the new class will be lost.

Continue?`)) {
                elementClass.value = elementToEdit.getClass();
                return;
            }//if
            kresmer.edAPI.changeLinkClass(elementToEdit, newClass as NetworkLinkClass);
        }//if

        elementProps.value = buildElementProps(newClass);
        formValidated.value = false;
    }//changeClass


    function buildElementProps(_class: NetworkElementClass)
    {
        const props = Object.keys(_class.props)
            .map(name => 
                {
                    const validValues = _class.props[name].validator?.validValues;
                    const pattern = _class.props[name].validator?.pattern;
                    return {
                        name, 
                        value: elementToEdit.props[name], 
                        type: _class.props[name].type,
                        required: _class.props[name].required,
                        validValues,
                        pattern,
                        isExpanded: false,
                    }
                });
        return props;
    }//buildElementProps


    function validateElementName()
    {
        if (!elementName.value) {
            elementNameValidationMessage.value = "Element name is required!";
        } else if (!elementToEdit.checkNameUniqueness(elementName.value!)) {
            elementNameValidationMessage.value = "Duplicate element name!";
        } else {
            elementNameValidationMessage.value = "";
        }//if
        inpElementName.value?.setCustomValidity(elementNameValidationMessage.value);
        return !elementNameValidationMessage.value;
    }//validateElementName

    const elementNameValidationMessage = ref("");

    let dbID: number|string|undefined;

    // eslint-disable-next-line @typescript-eslint/ban-types
    type ElementProp = {name: string, value: unknown, type: Function, required: boolean, 
                        validValues?: string[], pattern?: string, isExpanded?: boolean};
    const elementProps = ref<ElementProp[]>([]);

    function show(element: NetworkElement)
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!, {backdrop: "static", scroll: true});
        }//if

        const classes = element instanceof NetworkLink ? 
            [...kresmer.getRegisteredLinkClasses()].filter(([name, _class]) => !_class.isAbstract) : 
            [...kresmer.getRegisteredComponentClasses()].filter(([name, _class]) => !_class.autoInstanciate && !_class.forEmbeddingOnly);
        allClasses.value = classes
            .sort((c1, c2) => c1[0] < c2[0] ? -1 : c1[0] > c2[0] ? 1 : 0)
            .map(([name, _class]) => {return {name, _class}});
        elementClass.value = element.getClass();

        elementToEdit = element;
        elementName.value = element.name;
        dbID = element.dbID;
        elementProps.value = buildElementProps(element.getClass());
        formEnabled.value = true;
        formValidated.value = false;
        offCanvas.show();
    }//show

    function validateProp(prop: ElementProp)
    {
        let v: unknown;
        let wasError = false;
        switch (prop.type) {
            case Object: case Array:
                try {
                    v = JSON.parse(prop.value as string);
                    if (prop.type === Object) {
                        wasError = typeof v !== "object";
                    } else {
                        wasError = !Array.isArray(v);
                    }//if
                } catch {
                    wasError = true;
                }
                break;
            case Number:
                if (prop.value === undefined) {
                    v = undefined;
                } else {
                    v = parseFloat(prop.value as string);
                    wasError = isNaN(v as number);
                }//if
                break;
            default:
                v = prop.value;
        }//switch

        return wasError ? null : v;
    }//validateProp

    function save()
    {
        const propsWithErrors: string[] = [];
        for (const prop of elementProps.value) {
            if (validateProp(prop) === null) {
                propsWithErrors.push(prop.name);
            }//if
        }//for

        if (propInputs.value) {
            for (const input of propInputs.value) {
                if (!input.validity.valid) {
                    propsWithErrors.push(input.dataset.propName!);
                } else if (propsWithErrors.includes(input.dataset.propName!)) {
                    input.setCustomValidity("Syntax error!");
                }//if
            }//for
            if (propsWithErrors.length || !validateElementName()) {
                formValidated.value = true;
                return;
            }//if
        }//if

        close();
        elementToEdit.kresmer.edAPI.updateElement(elementToEdit, elementProps.value, elementName.value, dbID);
        updateWindowTitle();
    }//save

    function close()
    {
        offCanvas!.hide();
        formEnabled.value = false;
    }//close

    function collateSubprops(s1: string, s2: string): number
    {
        const chunks1 = s1.split(/[:.]/), chunks2 = s2.split(/[:.]/);
        if (chunks1.length < chunks2.length)
            return -1;
        if (chunks1.length > chunks2.length)
            return 1;

        for (let i = 0; i < chunks1.length; i++) {
            const c1 = chunks1[i], c2 = chunks2[i];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isNum1 = !isNaN(c1 as any), isNum2 = !isNaN(c2 as any);
            if (!isNum1 && !isNum2) {
                if (c1 < c2)
                    return -1;
                if (c1 > c2)
                    return 1;
                continue;
            }//if
            if (!isNum1)
                return 1;
            if (!isNum2)
                return -1;
            const n1 = parseInt(c1), n2 = parseInt(c2);
            if (n1 < n2)
                return -1;
            if (n1 > n2)
                return 1;
        }//for

        return 0;
    }//collateSubprops

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end" tabindex="-1">
        <div class="offcanvas-header align-items-baseline">
            <div>
                <h5 class="offcanvas-title">{{elementName}}</h5>
                <h6 class="text-secondary">
                    <select class="form-select form-select-sm text-secondary" v-model="elementClass" @change="changeClass">
                        <option v-for="ec in allClasses" :value="ec._class" :key="ec.name">{{ec.name}}</option>
                    </select>
                </h6>
            </div>
            <button type="button" class="btn-close" @click="close"></button>
        </div>
        <div class="offcanvas-body">
            <form v-if="formEnabled" :class='{"was-validated": formValidated}'>
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <td><label for="inpElementName">name</label></td>
                            <td>
                                <input id="inpElementName" type="text" class="form-control form-control-sm" 
                                       v-model="elementName" ref="inpElementName"/>
                                <div class="invalid-feedback">
                                    {{ elementNameValidationMessage }}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><label for="inpDbID">dbID</label></td>
                            <td>
                                <input id="inpDbID" type="number" class="form-control form-control-sm" v-model="dbID"/>
                            </td>
                        </tr>
                        <tr v-for="prop in elementProps" :key="`prop[${prop.name}]`">
                            <td>
                                <label class="form-label form-label-sm" :for="`inpProp[${prop.name}]`"
                                       @click="prop.isExpanded = !prop.isExpanded">{{ prop.name }}</label>
                                <button type="button" class="btn btn-sm" v-if="prop.type === Object || prop.type === Array"
                                       @click="prop.isExpanded = !prop.isExpanded">
                                    <span class="material-symbols-outlined" v-if="!prop.isExpanded">expand_more</span>
                                    <span class="material-symbols-outlined" v-else>expand_less</span>
                                </button>
                                <template v-if="prop.isExpanded && prop.type === Object && prop.value">
                                    <div class="row" v-for="subPropName in Object.keys(prop.value as object).sort(collateSubprops)" 
                                         :key="`${prop.name}[${subPropName}]`">
                                        <div class="col text-end text-secondary">{{ subPropName }}</div>
                                    </div>
                                </template>
                            </td>
                            <td>
                                <select v-if="prop.validValues" ref="propInputs" :data-prop-name="prop.name"
                                       class="form-select form-select-sm" :id="`inpProp[${prop.name}]`"
                                       v-model="prop.value">
                                    <option v-if="!prop.required" :value="undefined"></option>
                                    <option v-for="(choice, i) in prop.validValues"  class="text-secondary"
                                            :key="`${prop.name}[${i}]`">{{ choice }}</option>
                                </select>
                                <input v-else-if="prop.type === Number" type="number" :id="`inpProp[${prop.name}]`"
                                    ref="propInputs" :data-prop-name="prop.name"
                                    class="form-control form-control-sm text-end"
                                    v-model="prop.value"/>
                                <input v-else-if="prop.type === Boolean" type="checkbox"
                                    ref="propInputs" :data-prop-name="prop.name" :id="`inpProp[${prop.name}]`"
                                    class="form-check-input"
                                    v-model="prop.value"/>
                                <template v-else-if="prop.type === Object">
                                    <input
                                        ref="propInputs" :data-prop-name="prop.name" :id="`inpProp[${prop.name}]`"
                                        class="form-control form-control-sm text-secondary" readonly
                                        :value="JSON.stringify(prop.value)"/>
                                    <template v-if="prop.value && prop.isExpanded">
                                        <div v-for="subPropName in Object.keys(prop.value).sort(collateSubprops)" class="row"
                                             :key="`${prop.name}.${subPropName}`">
                                            <div class="col">
                                                <input v-if="typeof prop.value[subPropName] === 'number'" type="number" 
                                                    class="form-control form-control-sm" v-model="prop.value[subPropName]" />
                                                <input v-else type="text" class="form-control form-control-sm"
                                                    v-model="prop.value[subPropName]" />
                                            </div>
                                        </div>
                                    </template>
                                </template>
                                <input v-else 
                                    ref="propInputs" :data-prop-name="prop.name" :id="`inpProp[${prop.name}]`"
                                    :pattern="prop.pattern"
                                    class="form-control form-control-sm"
                                    v-model="prop.value"/>
                                <div class="invalid-feedback">
                                    Syntax error!
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary" @click.prevent="save">Save</button>
                </div>
            </form>
        </div>
    </div>
</template>