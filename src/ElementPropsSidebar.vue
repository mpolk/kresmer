<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing network elements properties
<*************************************************************************** -->

<script setup lang="ts">
    import { ref } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import { NetworkElement } from 'kresmer';

    let offCanvas!: Offcanvas;
    const rootDiv = ref<HTMLDivElement>();
    const propInputs = ref<[HTMLInputElement]>();
    const formValidated = ref(false);

    let elementToEdit: NetworkElement;
    const elementName = ref("");
    // eslint-disable-next-line @typescript-eslint/ban-types
    type ElementProp = {name: string, value: unknown, type: Function, validValues?: string[]};
    const elementProps = ref<ElementProp[]>([]);

    function show(element: NetworkElement)
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!);
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
        offCanvas.show();
    }//show

    function validateProp(prop: ElementProp, checkType: (v: unknown) => boolean)
    {
        let v: unknown;
        let wasError = false;
        try {
            v = JSON.parse(prop.value as string);
        } catch {
            wasError = true;
        }
        if (!wasError && !checkType(v)) {
            wasError = true;
        }//if
        if (wasError) {
            return false;
        }//if

        elementToEdit.props[prop.name] = v;
        return true;
    }//validateProp

    function save()
    {
        const propsWithErrors: string[] = [];
        for (const prop of elementProps.value) {
            switch (prop.type) {
                case Array: 
                    if (!validateProp(prop, v => Array.isArray(v))) {
                        propsWithErrors.push(prop.name);
                    }//if
                    break;
                case Object: 
                    if (!validateProp(prop, v => typeof v === "object")) {
                        propsWithErrors.push(prop.name);
                    }//if
                    break;
                default:
                    elementToEdit.props[prop.name] = prop.value;
            }//switch
        }//for

        if (propsWithErrors.length) {
            for (const input of propInputs.value!) {
                if (propsWithErrors.includes(input.getAttribute("dataPropName")!)) {
                    input.setCustomValidity("Syntax error!");
                }//if
            }//for
            formValidated.value = true;
            return;
        }//if

        elementToEdit.name = elementName.value;
        offCanvas.hide();
    }//save

    function close()
    {
        offCanvas.hide();
    }//close

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end" 
         data-bs-backdrop="static" data-bs-scroll="true" tabindex="-1">
        <div class="offcanvas-header align-items-baseline">
            <div>
                <h5 class="offcanvas-title">{{elementName}}</h5>
                <h6 class="text-secondary">{{elementToEdit?.getClass()?.name}}</h6>
            </div>
            <button type="button" class="btn-close" @click="close"></button>
         </div>
        <div class="offcanvas-body">
            <form v-if="elementToEdit" :class="{wasValidated: formValidated}">
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