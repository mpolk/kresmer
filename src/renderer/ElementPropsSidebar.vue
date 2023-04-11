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
    let elementClass: NetworkElementClass;

    function changeClass() {
        const newClass = elementClass;

        if (elementToEdit instanceof NetworkComponent) {
            kresmer.edAPI.changeComponentClass(elementToEdit, newClass as NetworkComponentClass);
        } else if (elementToEdit instanceof NetworkLink) {
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
                    return {
                        name, 
                        value: elementToEdit.props[name], 
                        type: _class.props[name].type,
                        required: _class.props[name].required,
                        validValues,
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
    type ElementProp = {name: string, value: unknown, type: Function, required: boolean, validValues?: string[]};
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
        elementClass = element.getClass();

        elementToEdit = element;
        elementName.value = element.name;
        dbID = element.dbID;
        elementProps.value = buildElementProps(element.getClass());
        formEnabled.value = true;
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

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end" tabindex="-1">
        <div class="offcanvas-header align-items-baseline">
            <div>
                <h5 class="offcanvas-title">{{elementName}}</h5>
                <h6 class="text-secondary">
                    <select class="form-select form-select-sm" v-model="elementClass" @change="changeClass">
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
                            <td>{{ prop.name }}</td>
                            <td>
                                <select v-if="prop.validValues" ref="propInputs" :data-prop-name="prop.name"
                                       class="form-select form-select-sm"
                                       v-model="prop.value">
                                    <option v-if="!prop.required" :value="undefined"></option>
                                    <option v-for="(choice, i) in prop.validValues" 
                                            :key="`${prop.name}[${i}]`">{{ choice }}</option>
                                </select>
                                <input v-else-if="prop.type === Number" type="number" 
                                    ref="propInputs" :data-prop-name="prop.name"
                                    class="form-control form-control-sm text-end"
                                    v-model="prop.value"/>
                                <input v-else-if="prop.type === Boolean 
                                                  /*calm Vue typechecker*/ 
                                                  && (typeof prop.value === 'boolean' || 
                                                      typeof prop.value === 'undefined')" type="checkbox"
                                    ref="propInputs" :data-prop-name="prop.name"
                                    class="form-check-input"
                                    v-model="prop.value"/>
                                <input v-else 
                                    ref="propInputs" :data-prop-name="prop.name"
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