<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing network elements properties
<*************************************************************************** -->

<script lang="ts">
    import { nextTick, ref, watch } from 'vue';
    import { Modal, Offcanvas } from 'bootstrap';
    import { NetworkElement, NetworkElementClass, NetworkElementPropCategory,
             NetworkComponent, NetworkComponentClass, 
             NetworkLink, NetworkLinkClass } from 'kresmer';
    import { kresmer, updateWindowTitle } from './renderer-main';

    // eslint-disable-next-line @typescript-eslint/ban-types
    export type ElementProp = {name: string, value: unknown, type: Function, required: boolean, 
                        validValues?: string[], pattern?: string, isExpanded?: boolean, 
                        category?: NetworkElementPropCategory, default?: string, description?: string};

    export default {
        name: "ElementPropsSidebar",
    }
</script>

<script setup lang="ts">
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
    let dbID: number|string|undefined;

    /**
     * Displays the sidebars and allows to edit the element
     * @param element An element to edit
     */
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
        elementProps.value = buildElementPropsArray(element.getClass());
        formEnabled.value = true;
        formValidated.value = false;
        offCanvas.show();
    }//show

    const elementClass = ref<NetworkElementClass>();
    const allClasses = ref<{name: string, _class: NetworkElementClass}[]>([]);
    
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
Changing link class will make the values of the link properties that absent in the new class to be lost.

Continue?`)) {
                elementClass.value = elementToEdit.getClass();
                return;
            }//if
            kresmer.edAPI.changeLinkClass(elementToEdit, newClass as NetworkLinkClass);
        }//if

        elementProps.value = buildElementPropsArray(newClass);
        formValidated.value = false;
    }//changeClass

    /**
     * An array of the element props (with values)
     */
    const elementProps = ref<ElementProp[]>([]);

    /**
     * Builds an array of the element props (with values)
     * based on element's class  and the values taken from the dialog inputs
     * @param _class An element class
     */
    function buildElementPropsArray(_class: NetworkElementClass)
    {
        const props = Object.keys(_class.props)
            .map(name => 
                {
                    const validValues = _class.props[name].validator?.validValues;
                    const pattern = _class.props[name].validator?.pattern;
                    return {
                        name, 
                        value: _class.props[name].type === Object ? {...elementToEdit.props[name] as object} :
                            _class.props[name].type === Array ? [...elementToEdit.props[name] as unknown[]] :
                            elementToEdit.props[name], 
                        type: _class.props[name].type,
                        required: _class.props[name].required,
                        category: _class.props[name].category,
                        validValues,
                        pattern,
                        default: _class.props[name].default,
                        description: _class.props[name].description,
                        isExpanded: false,
                    }
                })
            .sort((p1, p2) => 
                {
                    if (!p1.category && p2.category || p1.category < p2.category)
                        return -1;
                    if (p1.category && !p2.category || p1.category > p2.category)
                        return 1;
                    if (p1.name < p2.name)
                        return -1;
                    if (p1.name > p2.name)
                        return 1;
                    return 0;
                });
        return props;
    }//buildElementPropsArray

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

    /** Validates a single prop (after parsing it) and returns its values (if it's found to be valid) or null
     * otherwise. "Undefined" is considered a valid value. */
    function validateProp(prop: ElementProp)
    {
        let v: unknown;
        let wasError = false;
        switch (prop.type) {
            case Array:
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
                if (prop.value === undefined || prop.value === "") {
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


    /**
     * Saves the updated data to the element
     */
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

    /** Closes (hides) the sidebar */
    function close()
    {
        offCanvas!.hide();
        formEnabled.value = false;
    }//close

    /** A callback for sorting subproperties. 
     * Tries to provide an order natural for switch ports: 
     * 1:1 1:2 1:10 2:1 2:10 ... */
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

    /**
     * Adds a new subprop (field) to the given pop
     * @param propName A prop to add the subprop to
     * @param type A type of the new subprop
     */
    function addSubprop(propName: string, type: "string"|"number"|"boolean")
    {
        propToAddSubpropTo.value = propName;
        newSubpropType.value = type;
        if (!dlgNewSubprop) {
            const el = document.querySelector("#dlgNewSubprop")!;
            el.addEventListener("shown.bs.modal", () => inpNewSubpropName.value!.focus());
            dlgNewSubprop = new Modal(el, {backdrop: "static", keyboard: true});
        }//if
        dlgNewSubprop.show();
    }//addSubprop

    /** Callback for completing adding a new field or the Object-type prop */
    function completeAddingSubprop()
    {
        if (!newSubpropName.value) {
            alert("Subproperty name cannot be empty!");
            return;
        }//if

        const i = elementProps.value.findIndex(prop => prop.name == propToAddSubpropTo.value);
        const prop = elementProps.value[i];
        if (!prop.value) {
            prop.value = {};
        }//if
        const propValue = prop.value as Record<string, unknown>;

        if (Object.hasOwn(propValue, newSubpropName.value)) {
            alert(`Subprop "${newSubpropName.value}" already exists in the prop "${prop.name}"`);
            return;
        }//if

        switch (newSubpropType.value) {
            case "string":
                propValue[newSubpropName.value] = "";
                break;
            case "number":
                propValue[newSubpropName.value] = 0;
                break;
            case "boolean":
                propValue[newSubpropName.value] = false;
                break;
        }//switch

        dlgNewSubprop.hide();
        prop.isExpanded = true;
        nextTick(() => {
            const inpToFocus = document.getElementById(subpropInputID(prop.name, newSubpropName.value)) as HTMLInputElement;
            inpToFocus.focus();
        });
    }//completeAddingSubprop

    /**
     * Deletes the specified subprop from the given property
     * @param propName Prop to delete the subprop from
     * @param subpropName Subprop to delete
     */
    function deleteSubprop(propName: string, subpropName: string)
    {
        const i = elementProps.value.findIndex(prop => prop.name == propName);
        const prop = elementProps.value[i];
        delete (prop.value as Record<string, unknown>)[subpropName];
    }// deleteSubprop

    let dlgNewSubprop!: Modal;
    const propToAddSubpropTo = ref("");
    const newSubpropName = ref("");
    const inpNewSubpropName = ref<HTMLInputElement>();
    const newSubpropType = ref<"string"|"number"|"boolean">("string");

    function subpropInputID(propName: string, subpropName: string)
    {
        return `inpSubprop[${propName},${subpropName}]`;
    }//subpropInputID

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end" tabindex="-1">
        <!-- Sidebar header -->
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
        <!-- Sidebar body -->
        <div class="offcanvas-body">
            <form v-if="formEnabled" :class='{"was-validated": formValidated}'>
                <table class="table table-bordered"><tbody>
                    <!-- Element name -->
                    <tr>
                        <td class="align-middle p-1"><label class="form-lable mb-0" for="inpElementName">name</label></td>
                        <td class="p-1">
                            <input id="inpElementName" type="text" class="form-control form-control-sm border-0" 
                                    v-model="elementName" ref="inpElementName"/>
                            <div class="invalid-feedback">
                                {{ elementNameValidationMessage }}
                            </div>
                        </td>
                    </tr>
                    <!-- Element DB identifier -->
                    <tr>
                        <td class="align-middle p-1"><label class="form-lable mb-0" for="inpDbID">dbID</label></td>
                        <td class="p-1">
                            <input id="inpDbID" class="form-control form-control-sm border-0" v-model="dbID"/>
                        </td>
                    </tr>
                    <!-- Element props -->
                    <template v-for="(prop, i) in elementProps" :key="`prop[${prop.name}]`">
                        <tr v-if="prop.category && (i === 0 || prop.category !== elementProps[i-1].category)">
                            <td colspan="2" class="border-0 text-primary text-opacity-75">
                                {{ NetworkElementPropCategory[prop.category] }}
                            </td>
                        </tr>
                        <tr>
                            <!-- Prop name -->
                            <td class="align-middle p-1">
                                <label class="form-label mb-0" :for="`inpProp[${prop.name}]`"
                                    :title="prop.description"
                                    @click="prop.isExpanded = !prop.isExpanded"
                                    >
                                    {{ prop.name }}
                                </label>
                                <button type="button" class="btn btn-sm" v-if="prop.type === Object || prop.type === Array"
                                        @click="prop.isExpanded = !prop.isExpanded">
                                    <span class="material-symbols-outlined align-top">
                                        {{`expand_${prop.isExpanded ? "less" : "more"}`}}
                                    </span>
                                </button>
                            </td>
                            <!-- Prop value -->
                            <td class="p-1">
                                <select v-if="prop.validValues" ref="propInputs" :data-prop-name="prop.name"
                                        class="form-select form-select-sm border-0" :id="`inpProp[${prop.name}]`"
                                        v-model="prop.value">
                                    <option v-if="!prop.required" :value="undefined"></option>
                                    <option v-for="(choice, i) in prop.validValues" class="text-secondary"
                                            :key="`${prop.name}[${i}]`">{{ choice }}</option>
                                </select>
                                <input v-else-if="prop.type === Number" type="number" :id="`inpProp[${prop.name}]`"
                                    ref="propInputs" :data-prop-name="prop.name"
                                    class="form-control form-control-sm text-end border-0"
                                    :placeholder="prop.default"
                                    v-model="prop.value"/>
                                <input v-else-if="prop.type === Boolean" type="checkbox"
                                    ref="propInputs" :data-prop-name="prop.name" :id="`inpProp[${prop.name}]`"
                                    class="form-check-input"
                                    v-model="prop.value"/>
                                <div v-else-if="prop.type === Object" class="input-group input-group-sm mb-1">
                                    <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                            data-bs-toggle="dropdown" title="Add subproperty">
                                        <span class="material-symbols-outlined">add</span>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li style="cursor: pointer;"><a class="dropdown-item" @click="addSubprop(prop.name, 'string')">string</a></li>
                                        <li style="cursor: pointer;"><a class="dropdown-item" @click="addSubprop(prop.name, 'number')">number</a></li>
                                        <li style="cursor: pointer;"><a class="dropdown-item" @click="addSubprop(prop.name, 'boolean')">boolean</a></li>
                                    </ul>
                                    <input
                                        ref="propInputs" :data-prop-name="prop.name" :id="`inpProp[${prop.name}]`"
                                        class="form-control form-control-sm text-secondary border-0" readonly
                                        :value="JSON.stringify(prop.value)"/>
                                </div>
                                <input v-else 
                                    ref="propInputs" :data-prop-name="prop.name" :id="`inpProp[${prop.name}]`"
                                    :pattern="prop.pattern"
                                    class="form-control form-control-sm border-0"
                                    :placeholder="prop.default"
                                    v-model="prop.value"/>
                                <div class="invalid-feedback">
                                    Syntax error!
                                </div>
                            </td>
                        </tr>
                        <!-- Subprops (if exist) -->
                        <template v-if="prop.isExpanded && prop.type === Object && prop.value">
                            <tr v-for="(subpropName, spi) in Object.keys(prop.value).sort(collateSubprops)" 
                                    :key="`${prop.name}[${subpropName}]`">
                                <!-- Subprop name -->
                                <td class="align-middle text-end text-secondary p-1"
                                    :style="spi < Object.keys(prop.value).length-1 ? 'border-bottom-style: dotted!important' : ''">
                                    <label class="form-label mb-0" :for="subpropInputID(prop.name, subpropName)">
                                        {{ subpropName }}
                                    </label>
                                    <button type="button" class="btn btn-sm btn-outline-light pe-0 ps-1 pb-0" 
                                            title="Delete subproperty" @click="deleteSubprop(prop.name, subpropName)">
                                        <span class="material-symbols-outlined align-top">close</span>
                                    </button>
                                </td>
                                <!-- Subprop value -->
                                <td class="p-1">
                                    <input v-if="typeof (prop.value as Record<string, any>)[subpropName] === 'number'" 
                                        type="number" class="form-control form-control-sm text-end border-0" 
                                        :id="subpropInputID(prop.name, subpropName)"
                                        v-model="(prop.value as Record<string, any>)[subpropName]" />
                                    <input v-else-if="typeof (prop.value as Record<string, any>)[subpropName] === 'boolean'"
                                        type="checkbox" class="form-check-input form-check-input-sm"
                                        :id="subpropInputID(prop.name, subpropName)"
                                        v-model="(prop.value as Record<string, any>)[subpropName]" />
                                    <input v-else type="text" class="form-control form-control-sm border-0"
                                        :id="subpropInputID(prop.name, subpropName)"
                                        v-model="(prop.value as Record<string, any>)[subpropName]" />
                                </td>
                            </tr>
                        </template>
                    </template>
                </tbody></table>
                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary" @click.prevent="save">Save</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Dialog for adding subprops -->
    <div class="modal" tabindex="-1" id="dlgNewSubprop">
        <div class="modal-dialog">
            <form class="modal-content">
                <div class="modal-header">
                    Adding a&nbsp;<strong>{{ newSubpropType }}</strong>&nbsp;field to the "{{ propToAddSubpropTo }}" prop
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <label class="form-label" for="inpNewSubpropName">Name</label>
                    <input type="text" class="form-control" id="inpNewSubpropName" ref="inpNewSubpropName" v-model="newSubpropName"/>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-sm btn-primary" @click.prevent="completeAddingSubprop">Ok</button>
                    <button type="button" class="btn btn-sm btn-secondary" @click="dlgNewSubprop.hide">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</template>