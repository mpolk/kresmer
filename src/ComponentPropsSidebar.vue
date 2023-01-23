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

    let elementToEdit: NetworkElement;
    const elementName = ref("");
    const elementProps = ref<{name: string, value: unknown}[]>([]);

    function show(element: NetworkElement)
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!);
        }//if

        elementToEdit = element;
        elementName.value = element.name;
        elementProps.value = Object.keys(element._class.props)
            .map(name => {return {name, value: element.props[name]}});
        offCanvas.show();
    }//show

    function save()
    {
        elementToEdit.name = elementName.value;
        for (const prop of elementProps.value) {
            elementToEdit.props[prop.name] = prop.value;
        }//for
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
            <form v-if="elementToEdit">
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <td>name</td>
                            <td>
                                <input class="form-control" v-model="elementName"/>
                            </td>
                        </tr>
                        <tr v-for="prop in elementProps" :key="`prop[${prop.name}]`">
                            <td>{{ prop.name }}</td>
                            <td>{{ prop.value }}</td>
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