<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing network components properties
<*************************************************************************** -->

<script setup lang="ts">
    import { ref } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import { NetworkComponent } from 'kresmer';

    let offCanvas!: Offcanvas;
    const rootDiv = ref<HTMLDivElement>();

    let componentToEdit: NetworkComponent;
    const componentName = ref("");
    const componentProps = ref<{name: string, value: unknown}[]>([]);

    function show(component: NetworkComponent)
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!);
        }//if

        componentToEdit = component;
        componentName.value = component.name;
        componentProps.value = Object.keys(component._class.props)
            .map(name => {return {name, value: component.props[name]}});
        offCanvas.show();
    }//show

    function save()
    {
        componentToEdit.name = componentName.value;
        for (const prop of componentProps.value) {
            componentToEdit.props[prop.name] = prop.value;
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
                <h5 class="offcanvas-title">{{componentName}}</h5>
                <h6 class="text-secondary">{{componentToEdit?.getClass()?.name}}</h6>
            </div>
            <button type="button" class="btn-close" @click="close"></button>
         </div>
        <div class="offcanvas-body">
            <form v-if="componentToEdit">
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <td>name</td>
                            <td>
                                <input class="form-control" v-model="componentName"/>
                            </td>
                        </tr>
                        <tr v-for="prop in componentProps" :key="`prop[${prop.name}]`">
                            <td>{{ prop.name }}</td>
                            <td>{{ prop.value }}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="d-flex justify-content-end">
                    <button class="btn btn-primary" @click="save">Save</button>
                </div>
            </form>
        </div>
    </div>
</template>