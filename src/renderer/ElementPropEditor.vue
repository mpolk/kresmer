<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  An element of the sidebar for editing a single network element property
<*************************************************************************** -->

<script lang="ts">
    /* eslint-disable vue/no-mutating-props */
    import { PropType } from 'vue';
    import { Modal } from 'bootstrap';
    import { ElementProp } from './ElementPropsSidebar.vue';

    export default {
        name: "ElementPropEditor",
    }

    export function subpropInputID(propName: string, subpropName: string)
    {
        return `inpSubprop[${propName},${subpropName}]`;
    }//subpropInputID
</script>

<script setup lang="ts">
    const props = defineProps({
        propToEdit: {type: Object as PropType<ElementProp>, required: true},
        dlgNewSubprop: {type: Object as PropType<Modal>, required: true},
    });

    const emit = defineEmits<{
        (e: "add-subprop", propName: string, type: "string"|"number"|"boolean"): void,
    }>();

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
     * Deletes the specified subprop from the given property
     * @param propName Prop to delete the subprop from
     * @param subpropName Subprop to delete
     */
    function deleteSubprop(propName: string, subpropName: string)
    {
        delete (props.propToEdit.value as Record<string, unknown>)[subpropName];
    }// deleteSubprop

</script>

<template>
    <tr>
        <!-- Prop name -->
        <td class="align-middle p-1">
            <label class="form-label mb-0" :for="`inpProp[${propToEdit.name}]`"
                :title="propToEdit.description"
                @click="propToEdit.isExpanded = !propToEdit.isExpanded"
                >
                {{ propToEdit.name }}
            </label>
            <button type="button" class="btn btn-sm" v-if="propToEdit.type === Object || propToEdit.type === Array"
                    @click="propToEdit.isExpanded = !propToEdit.isExpanded">
                <span class="material-symbols-outlined align-top">
                    {{`expand_${propToEdit.isExpanded ? "less" : "more"}`}}
                </span>
            </button>
        </td>
        <!-- Prop value -->
        <td class="p-1">
            <select v-if="propToEdit.validValues" ref="propInputs" :data-prop-name="propToEdit.name"
                    class="form-select form-select-sm border-0" :id="`inpProp[${propToEdit.name}]`"
                    v-model="propToEdit.value">
                <option v-if="!propToEdit.required" :value="undefined"></option>
                <option v-for="(choice, i) in propToEdit.validValues" class="text-secondary"
                        :key="`${propToEdit.name}[${i}]`">{{ choice }}</option>
            </select>
            <input v-else-if="propToEdit.type === Number" type="number" :id="`inpProp[${propToEdit.name}]`"
                ref="propInputs" :data-prop-name="propToEdit.name"
                class="form-control form-control-sm text-end border-0"
                :placeholder="propToEdit.default"
                v-model="propToEdit.value"/>
            <input v-else-if="propToEdit.type === Boolean" type="checkbox"
                ref="propInputs" :data-prop-name="propToEdit.name" :id="`inpProp[${propToEdit.name}]`"
                class="form-check-input"
                v-model="propToEdit.value"/>
            <div v-else-if="propToEdit.type === Object" class="input-group input-group-sm mb-1">
                <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                        data-bs-toggle="dropdown" title="Add subproperty">
                    <span class="material-symbols-outlined">add</span>
                </button>
                <ul class="dropdown-menu">
                    <li style="cursor: pointer;"><a class="dropdown-item" @click="emit('add-subprop', propToEdit.name, 'string')">string</a></li>
                    <li style="cursor: pointer;"><a class="dropdown-item" @click="emit('add-subprop', propToEdit.name, 'number')">number</a></li>
                    <li style="cursor: pointer;"><a class="dropdown-item" @click="emit('add-subprop', propToEdit.name, 'boolean')">boolean</a></li>
                </ul>
                <input
                    ref="propInputs" :data-prop-name="propToEdit.name" :id="`inpProp[${propToEdit.name}]`"
                    class="form-control form-control-sm text-secondary border-0" readonly
                    :value="JSON.stringify(propToEdit.value)"/>
            </div>
            <input v-else 
                ref="propInputs" :data-prop-name="propToEdit.name" :id="`inpProp[${propToEdit.name}]`"
                :pattern="propToEdit.pattern"
                class="form-control form-control-sm border-0"
                :placeholder="propToEdit.default"
                v-model="propToEdit.value"/>
            <div class="invalid-feedback">
                Syntax error!
            </div>
        </td>
    </tr>
    <!-- Subprops (if exist) -->
    <template v-if="propToEdit.isExpanded && propToEdit.type === Object && propToEdit.value">
        <tr v-for="(subpropName, spi) in Object.keys(propToEdit.value).sort(collateSubprops)" 
                :key="`${propToEdit.name}[${subpropName}]`">
            <!-- Subprop name -->
            <td class="align-middle text-end text-secondary p-1"
                :style="spi < Object.keys(propToEdit.value).length-1 ? 'border-bottom-style: dotted!important' : ''">
                <label class="form-label mb-0" :for="subpropInputID(propToEdit.name, subpropName)">
                    {{ subpropName }}
                </label>
                <button type="button" class="btn btn-sm btn-outline-light pe-0 ps-1 pb-0" 
                        title="Delete subproperty" @click="deleteSubprop(propToEdit.name, subpropName)">
                    <span class="material-symbols-outlined align-top">close</span>
                </button>
            </td>
            <!-- Subprop value -->
            <td class="p-1">
                <input v-if="typeof (propToEdit.value as Record<string, any>)[subpropName] === 'number'" 
                    type="number" class="form-control form-control-sm text-end border-0" 
                    :id="subpropInputID(propToEdit.name, subpropName)"
                    v-model="(propToEdit.value as Record<string, any>)[subpropName]" />
                <input v-else-if="typeof (propToEdit.value as Record<string, any>)[subpropName] === 'boolean'"
                    type="checkbox" class="form-check-input form-check-input-sm"
                    :id="subpropInputID(propToEdit.name, subpropName)"
                    v-model="(propToEdit.value as Record<string, any>)[subpropName]" />
                <input v-else type="text" class="form-control form-control-sm border-0"
                    :id="subpropInputID(propToEdit.name, subpropName)"
                    v-model="(propToEdit.value as Record<string, any>)[subpropName]" />
            </td>
        </tr>
    </template>
</template>