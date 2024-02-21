<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  An element of the sidebar for editing a single network element property
<*************************************************************************** -->

<script lang="ts">
    /* eslint-disable vue/no-mutating-props */
    import { PropType, computed, inject, ref, watch } from 'vue';
    import { Modal } from 'bootstrap';
    import { ElementPropDescriptor, ikExpansionTrigger } from './ElementPropsSidebar.vue';
    import { URLType, getURLType, urlTypeDescriptions } from './URLType';
    import { FileFilter } from 'electron';
import { selectOrLoadGraphicsFile } from './renderer-main';

    export default {
        name: "ElementPropEditor",
    }

    export function subpropInputID(parentProp: ElementPropDescriptor, subpropName?: string)
    {
        const path: string[] = [];
        let prop: ElementPropDescriptor|undefined = parentProp;
        while (prop) {
            path.unshift(prop.name);
            prop = prop.parentPropDescriptor;
        }//while
        if (subpropName)
            path.push(subpropName);
        return `inpSubprop[${path.join(".")}]`;
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
    const expansionTrigger = inject(ikExpansionTrigger);
    watch(() => expansionTrigger?.value, () => {
        function comparePropDescriptors(d1: ElementPropDescriptor|undefined, d2: ElementPropDescriptor|undefined): boolean
        {
            if (d1 && !d2)
                return false;
            if (!d1 && d2)
                return false;
            if (!d1 && !d2)
                return true;
            if (d1!.name != d2!.name)
                return false;
            return comparePropDescriptors(d1!.parentPropDescriptor, d2!.parentPropDescriptor);
        }//comparePropDescriptors
        
        if (comparePropDescriptors(expansionTrigger?.value, props.propToEdit)) {
            isExpanded.value = true;
        }//if
    });

    const emit = defineEmits<{
        (e: "add-subprop", parentProp: ElementPropDescriptor, type: "string"|"number"|"boolean"|"object"): void,
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
                    return {
                        name, 
                        value: parentPropValue[name], 
                        type: Array.isArray(parentPropValue[name]) ? Array :
                            typeof parentPropValue[name] === "object" ? Object :
                            typeof parentPropValue[name] === "number" ? Number :
                            typeof parentPropValue[name] === "boolean" ? Boolean :
                            String,
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
            if (props.subpropLevel == 0) {
                let value = props.propToEdit.value;
                if (props.propToEdit.subtype === 'color' && props.propToEdit.value === undefined)
                    value = props.propToEdit.default;
                return value;
            } else
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
        if (confirm(`Delete subproperty "${subpropName}"? Are you sure?`))
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
    function onDescendantAddSubprop(parentProp: ElementPropDescriptor, type: "string"|"number"|"boolean"|"object")
    {
        emit("add-subprop", parentProp, type);
    }//onDescendantAddSubprop

    const cbColorDefined = ref<HTMLInputElement>();
    function onColorDefUndef()
    {
        props.propToEdit.value = cbColorDefined.value?.checked ? (props.propToEdit.default ?? "#ffffff") : undefined;
    }//onColorDefUndef

    const valueCellClass = computed(() => {
        return {"text-center": props.propToEdit.type === Boolean};
    })//valueCellClass

    const urlType = ref(getURLType(props.propToEdit.subtype === "url" ? props.propToEdit.value as string: undefined));

    function setUrlType(newType: URLType)
    {
        urlType.value = newType;
    }//setUrlType

    async function setGraphicsURL()
    {
        props.propToEdit.value = await selectOrLoadGraphicsFile(urlType.value);
    }//setGraphicsURL
</script>

<template>
    <tr>
        <!-- Prop name -->
        <td class="py-1 pe-1 align-middle" :style="subpropNameCellStyle(subpropIndex)">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-inline-block">
                    <label class="form-label mb-0" :class="{'text-secondary': subpropLevel}" :for="subpropInputID(propToEdit)"
                        :title="propToEdit.description"
                        @click="isExpanded = !isExpanded"
                        >
                        {{ propToEdit.name }}
                    </label>
                    <button type="button" class="btn btn-sm" v-if="propToEdit.type === Object || propToEdit.type === Array"
                            @click="isExpanded = !isExpanded">
                        <span class="material-symbols-outlined">
                            {{`expand_${isExpanded ? "less" : "more"}`}}
                        </span>
                    </button>
                </div>
                <div v-if="propToEdit.type === Object" class="btn-group">
                    <button v-if="subpropLevel" type="button" class="btn btn-sm btn-outline-light" 
                            title="Delete subproperty" @click="deleteSubprop(propToEdit.parentPropDescriptor!.name, propToEdit.name)">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-light dropdown-toggle" 
                            data-bs-toggle="dropdown" title="Add subproperty">
                        <span class="material-symbols-outlined">add</span>
                    </button>
                    <ul class="dropdown-menu">
                        <li v-for="type in ['string', 'number', 'boolean', 'object']" :key="`add-${type}-subprop`" 
                            style="cursor: pointer;">
                            <a class="dropdown-item" @click="emit('add-subprop', propToEdit, type as any)">{{type}}</a>
                        </li>
                    </ul>
                </div>
                <button v-else-if="subpropLevel" type="button" class="btn btn-sm btn-outline-light" 
                        title="Delete subproperty" @click="deleteSubprop(propToEdit.parentPropDescriptor!.name, propToEdit.name)">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </td>
        <!-- Prop value -->
        <td class="p-1" :class="valueCellClass">
            <select v-if="propToEdit.validValues" ref="propInputs" :data-prop-name="propToEdit.name"
                    class="form-select form-select-sm border-0" :id="subpropInputID(propToEdit)"
                    v-model="subpropModel">
                <option v-if="!propToEdit.required" :value="undefined"></option>
                <option v-for="(choice, i) in propToEdit.validValues" class="text-secondary"
                        :key="`${propToEdit.name}[${i}]`">{{ choice }}</option>
            </select>
            <template v-else-if="propToEdit.type === Number">
                <input type="number" :id="subpropInputID(propToEdit)"
                    ref="propInputs" :data-prop-name="propToEdit.name"
                    class="form-control form-control-sm text-end border-0"
                    :placeholder="propToEdit.default"
                    v-model="subpropModel"/>
                <input v-if="propToEdit.min !== undefined && propToEdit.max !== undefined" type="range" class="form-range" 
                    :min="propToEdit.min" :max="propToEdit.max" :step="(propToEdit.max - propToEdit.min)*0.05" 
                    :value="propToEdit.value ?? propToEdit.default" 
                    @input="event => propToEdit.value = (event.target as HTMLInputElement).value">
            </template>
            <input v-else-if="propToEdit.type === Boolean" type="checkbox"
                ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
                class="form-check-input" :indeterminate="propToEdit.value === undefined"
                v-model="subpropModel"/>
            <input v-else-if="propToEdit.type === Object"
                ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
                class="form-control form-control-sm text-secondary border-0" readonly
                :value="JSON.stringify(propToEdit.value)"/>
            <div v-else-if="propToEdit.subtype === 'image-url'" class="input-group input-group-sm">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    {{ urlType }}
                </button>
                <ul class="dropdown-menu">
                    <li v-for="ut in URLType" :key="ut" :title="urlTypeDescriptions[ut]">
                        <a class="dropdown-item" href="#" @click="setUrlType(ut)">{{ ut }}</a>
                    </li>
                </ul>
                <button v-if="urlType !== 'href'" class="btn btn-outline-secondary btn-sm" type="button" @click="setGraphicsURL">
                    <span class="material-symbols-outlined">file_open</span>
                </button>
                <input ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
                    class="form-control form-control-sm"  :disabled="urlType !== URLType.href" 
                    :placeholder="propToEdit.default" v-model="subpropModel"/>
            </div>
            <div v-else-if="propToEdit.subtype === 'color'" class="row">
                <div v-if="!propToEdit.required" class="col-auto">
                    <div class="form-check form-switch form-check-inline d-inline-block">
                        <input class="form-check-input" type="checkbox" ref="cbColorDefined" 
                            :checked="Boolean(propToEdit.value)" @click="onColorDefUndef"/>
                    </div>
                </div>
                <div class="col">
                    <input v-show="propToEdit.value" type="color"
                        ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
                        class="form-control form-control-sm border-0"
                        v-model="subpropModel"/>
                </div>
            </div>
            <input v-else 
                ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
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
./URLType