<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  An element of the sidebar for editing a single network element property
<*************************************************************************** -->

<script lang="ts">
    /* eslint-disable vue/no-mutating-props */
    import { PropType, computed, ref } from 'vue';
    import { Modal } from 'bootstrap';
    import { ElementPropDescriptor } from './ElementPropsSidebar.vue';

    export default {
        name: "ElementPropEditor",
    }

    export function subpropInputID(propName: string, subpropName?: string)
    {
        return `inpSubprop[${propName},${subpropName}]`;
    }//subpropInputID
</script>

<script setup lang="ts">
    const props = defineProps({
        propToEdit: {type: Object as PropType<ElementPropDescriptor>, required: true},
        dlgNewSubprop: {type: Object as PropType<Modal>, required: true},
        subpropLevel: {type: Number, default: 0},
        subpropIndex: {type: Number, default: 0},
    });

    const isExpanded = ref(false);

    const emit = defineEmits<{
        (e: "add-subprop", parentProp: ElementPropDescriptor, type: "string"|"number"|"boolean"): void,
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
     * Builds an array of the subproperty descriptors of the specified (sub)prop
     * @param _class An element class
     */
    function buildSubpropDescriptors(parentPropValue: Record<string, unknown>): ElementPropDescriptor[]
    {
        const descriptors = Object.keys(parentPropValue)
            .map(name => 
                {
                    const type = Array.isArray(parentPropValue[name]) ? Array :
                        typeof parentPropValue[name] === "object" ? Object :
                        typeof parentPropValue[name] === "number" ? Number :
                        typeof parentPropValue[name] === "boolean" ? Boolean :
                        String;
                    return {
                        name, 
                        value: type === Object ? {...parentPropValue[name] as object} :
                            type === Array ? [...parentPropValue[name] as unknown[]] :
                            parentPropValue[name], 
                        type,
                        required: false,
                        isExpanded: false,
                        parentPropDescriptor: props.propToEdit,
                    }
                })
            .sort((p1, p2) => collateSubprops(p1.name, p2.name));
        return descriptors;
    }//buildSubpropDescriptors

    /** Builds the model object for the value of the prop being edited  */
    const subpropModel = computed({
        get() {
            if (props.subpropLevel == 0)
                return props.propToEdit.value;
            else
                return getSubpropParentObject(rootProp.value as Record<string, unknown>, props.subpropLevel-1)[props.propToEdit.name];
        },
        set(newValue) {
            if (props.subpropLevel == 0)
                props.propToEdit.value = newValue;
            else
                getSubpropParentObject(rootProp.value as Record<string, unknown>, props.subpropLevel-1)[props.propToEdit.name] = newValue;
        }
    })//subpropModel

    /**  The root (the ultimate parent) of the (sub)property being edited */
    // eslint-disable-next-line vue/no-setup-props-destructure
    let rootProp = props.propToEdit;
    const rootPath: string[] = [];
    while (rootProp.parentPropDescriptor) {
        rootPath.unshift(rootProp.name);
        rootProp = rootProp.parentPropDescriptor;
    }//while

    /** Finds the immediate parent object of the subproperty being edited */
    function getSubpropParentObject(parentObject: Record<string, unknown>, depth: number): Record<string, unknown>
    {
        if (depth == 0)
            return parentObject;
        else
            return getSubpropParentObject(parentObject[rootPath[depth-1]] as Record<string, unknown>, depth-1);
    }//getSubpropParentObject

    /**
     * Deletes the specified subprop from the given property
     * @param propName Prop to delete the subprop from
     * @param subpropName Subprop to delete
     */
    function deleteSubprop(propName: string, subpropName: string)
    {
        delete getSubpropParentObject(rootProp.value as Record<string, unknown>, props.subpropLevel-1)[subpropName];
    }// deleteSubprop

    /**
     * Builds CSS for the table cell containing (sub-)prop name
     * @param index Subprop index within the subprop list
     */
    function subpropNameCellStyle(index: number) {
        let style = `padding-left: ${props.subpropLevel + 0.25}rem;`;
        if (typeof props.propToEdit.value === "object" && index < Object.keys(props.propToEdit.value!).length-1)
            style += ' border-bottom-style: dotted!important;';
        return style;
    }//subpropNameCellStyle

    /**
     * Bubbles a descendant "add-subprop" event
     * @param parentProp A property to add subprop to
     * @param type A new subprop type
     */
    function onDescendantAddSubprop(parentProp: ElementPropDescriptor, type: "string"|"number"|"boolean")
    {
        emit("add-subprop", parentProp, type);
    }//onDescendantAddSubprop
</script>

<template>
    <tr>
        <!-- Prop name -->
        <td class="align-middle py-1 pe-1" :style="subpropNameCellStyle(subpropIndex)">
            <label class="form-label mb-0" :class="{'text-secondary': subpropLevel}" :for="subpropInputID(propToEdit.name)"
                :title="propToEdit.description"
                @click="isExpanded = !isExpanded"
                >
                {{ propToEdit.name }}
            </label>
            <button v-if="subpropLevel" type="button" class="btn btn-sm btn-outline-light pe-0 ps-1 py-0" 
                    title="Delete subproperty" @click="deleteSubprop(propToEdit.parentPropDescriptor!.name, propToEdit.name)">
                <span class="material-symbols-outlined">close</span>
            </button>
            <button type="button" class="btn btn-sm" v-if="propToEdit.type === Object || propToEdit.type === Array"
                    @click="isExpanded = !isExpanded">
                <span class="material-symbols-outlined">
                    {{`expand_${isExpanded ? "less" : "more"}`}}
                </span>
            </button>
        </td>
        <!-- Prop value -->
        <td class="p-1">
            <select v-if="propToEdit.validValues" ref="propInputs" :data-prop-name="propToEdit.name"
                    class="form-select form-select-sm border-0" :id="subpropInputID(propToEdit.name)"
                    v-model="subpropModel">
                <option v-if="!propToEdit.required" :value="undefined"></option>
                <option v-for="(choice, i) in propToEdit.validValues" class="text-secondary"
                        :key="`${propToEdit.name}[${i}]`">{{ choice }}</option>
            </select>
            <input v-else-if="propToEdit.type === Number" type="number" :id="subpropInputID(propToEdit.name)"
                ref="propInputs" :data-prop-name="propToEdit.name"
                class="form-control form-control-sm text-end border-0"
                :placeholder="propToEdit.default"
                v-model="subpropModel"/>
            <input v-else-if="propToEdit.type === Boolean" type="checkbox"
                ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit.name)"
                class="form-check-input"
                v-model="subpropModel"/>
            <div v-else-if="propToEdit.type === Object" class="input-group input-group-sm mb-1">
                <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                        data-bs-toggle="dropdown" title="Add subproperty">
                    <span class="material-symbols-outlined">add</span>
                </button>
                <ul class="dropdown-menu">
                    <li style="cursor: pointer;"><a class="dropdown-item" @click="emit('add-subprop', propToEdit, 'string')">string</a></li>
                    <li style="cursor: pointer;"><a class="dropdown-item" @click="emit('add-subprop', propToEdit, 'number')">number</a></li>
                    <li style="cursor: pointer;"><a class="dropdown-item" @click="emit('add-subprop', propToEdit, 'boolean')">boolean</a></li>
                </ul>
                <input
                    ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit.name)"
                    class="form-control form-control-sm text-secondary border-0" readonly
                    :value="JSON.stringify(propToEdit.value)"/>
            </div>
            <input v-else 
                ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit.name)"
                :pattern="propToEdit.pattern"
                class="form-control form-control-sm border-0"
                :placeholder="propToEdit.default"
                v-model="subpropModel"/>
            <div class="invalid-feedback">
                Syntax error!
            </div>
        </td>
    </tr>
    <!-- Subprops (if exist) -->
    <template v-if="isExpanded && propToEdit.type === Object && propToEdit.value">
        <ElementPropEditor v-for="(subprop, i) in buildSubpropDescriptors(propToEdit.value as Record<string, any>)" 
            :key="`${propToEdit.name}[${subprop.name}]`" 
            :prop-to-edit="subprop" :dlg-new-subprop="dlgNewSubprop" :subprop-level="subpropLevel+1" 
            :subprop-index="i"
            @add-subprop="onDescendantAddSubprop"/>
    </template>
</template>