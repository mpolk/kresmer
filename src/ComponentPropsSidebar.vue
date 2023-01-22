<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing network components properties
<*************************************************************************** -->

<script setup lang="ts">
    import { ref, reactive, computed } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import { NetworkComponent } from 'kresmer';

    let offCanvas!: Offcanvas;
    const rootDiv = ref<HTMLDivElement>();

    let originalComponent: NetworkComponent;
    const data = reactive<{
        component?: NetworkComponent
    }>({});

    const componentProps = computed(() => {
        const props: {name: string, value?: unknown}[] = [];
        if (data.component) {
            for (const name in data.component._class.props) {
                props.push({name, value: data.component.props[name]});
            }//for
        }//if
        return props;
    })//componentProps

    function show(component: NetworkComponent)
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!);
        }//if

        data.component = originalComponent = component;
        offCanvas.show();
    }//show

    function save()
    {
        originalComponent.name = data.component!.name;
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
                <h5 class="offcanvas-title">{{data.component?.name}}</h5>
                <h6 class="text-secondary">{{data.component?.getClass()?.name}}</h6>
            </div>
            <button type="button" class="btn-close" @click="close"></button>
         </div>
        <div class="offcanvas-body">
            <form v-if="data.component">
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <td>name</td>
                            <td>
                                <input class="form-control" v-model="data.component.name"/>
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