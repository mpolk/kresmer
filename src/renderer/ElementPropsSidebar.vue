<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing network elements properties
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "ElementPropsSidebar",
    }
</script>

<script setup lang="ts">
    import { ref } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import { NetworkElement } from 'kresmer';
    import { updateWindowTitle } from './renderer-main';

    let offCanvas: Offcanvas | undefined;
    const rootDiv = ref<HTMLDivElement>();
    const propInputs = ref<[HTMLInputElement]>();
    const formEnabled = ref(false);
    const formValidated = ref(false);

    let elementToEdit: NetworkElement;
    const elementName = ref("");
    // eslint-disable-next-line @typescript-eslint/ban-types
    type ElementProp = {name: string, value: unknown, type: Function, validValues?: string[]};
    const elementProps = ref<ElementProp[]>([]);

    function show(element: NetworkElement)
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!, {backdrop: "static", scroll: true});
        }//if

        elementToEdit = element;
        elementName.value = element.name;
        elementProps.value = Object.keys(element._class.props)
            .map(name => 
                {
                    const validValues = element._class.props[name].validator?.validValues;
                    return {
                        name, 
                        value: element.props[name], 
                        type: element._class.props[name].type,
                        validValues,
                    }
                });
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
            if (propsWithErrors.length) {
                formValidated.value = true;
                return;
            }//if
        }//if

        close();
        elementToEdit.kresmer.updateElement(elementToEdit, elementProps.value, elementName.value);
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
                <h6 class="text-secondary">{{elementToEdit?.getClass()?.name}}</h6>
            </div>
            <button type="button" class="btn-close" @click="close"></button>
         </div>
        <div class="offcanvas-body">
            <form v-if="formEnabled" :class='{"was-validated": formValidated}'>
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <td>name</td>
                            <td>
                                <input class="form-control form-control-sm" v-model="elementName"/>
                            </td>
                        </tr>
                        <tr v-for="prop in elementProps" :key="`prop[${prop.name}]`">
                            <td>{{ prop.name }}</td>
                            <td>
                                <select v-if="prop.validValues" ref="propInputs" :data-prop-name="prop.name"
                                       class="form-select form-select-sm"
                                       v-model="prop.value">
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