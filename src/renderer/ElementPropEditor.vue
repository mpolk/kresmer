<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  An element of the sidebar for editing a single drawing element property
<*************************************************************************** -->

<script lang="ts">
    /* eslint-disable vue/no-mutating-props */
    import { computed, inject, ref, watch } from 'vue';
    import { Modal } from 'bootstrap';
    import { ElementPropDescriptor, ikClipboardContent, ikExpansionTrigger } from './ElementPropsSidebar.vue';
    import { URLType, getURLType, urlTypeDescription } from './URLType';
    import { selectOrLoadGraphicsFile } from './renderer-main';
    import { PropTypeDescriptor } from 'kresmer';
    import i18next from 'i18next';

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
    const {propToEdit, dlgNewSubprop, subpropLevel = 0, subpropIndex = 0} = defineProps<{
        propToEdit: ElementPropDescriptor,
        dlgNewSubprop: Modal,
        subpropLevel?: number,
        subpropIndex?: number,
    }>();

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
        
        if (comparePropDescriptors(expansionTrigger?.value, propToEdit)) {
            isExpanded.value = true;
        }//if
    });

    const emit = defineEmits<{
        (e: "add-subprop", where: ElementPropDescriptor): void,
        (e: "delete-subprop", from: ElementPropDescriptor, what: string): void,
        (e: "copy-to-clipboard", data: string): void,
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
     */
    const childSubpropDescriptors = computed((): ElementPropDescriptor[] => {
        const parentPropValue = propToEdit.value as Record<string, unknown>;
        const descriptors: ElementPropDescriptor[] = "elements" in propToEdit.typeDescriptor! ? 
                Object.entries(parentPropValue).map(([key, value]) => 
                {
                    return {
                        ...(propToEdit.typeDescriptor! as Extract<PropTypeDescriptor, {elements: unknown}>).elements,
                        name: key, 
                        value, 
                        required: false,
                        isExpanded: false,
                        parentPropDescriptor: propToEdit,
                        isDeletable: true,
                    }
                }).sort((p1, p2) => collateSubprops(p1.name, p2.name))
            :
                Object.entries(propToEdit.typeDescriptor!.subprops).map(([name, type]) => 
                {
                    return {
                        ...type,
                        name, 
                        value: parentPropValue[name], 
                        required: false,
                        isExpanded: false,
                        parentPropDescriptor: propToEdit,
                        isDeletable: false,
                    }
                })
            ;
        return descriptors;
    })//childSubpropDescriptors


    const withDynamicChildren = propToEdit.typeDescriptor && "elements" in propToEdit.typeDescriptor;


    /** Builds the model object for the value of the prop being edited  */
    const editorModel = computed({
        get() {
            if (!modelParent) {
                let value = propToEdit.value;
                if (propToEdit.subtype === 'color' && propToEdit.value === undefined)
                    value = propToEdit.default;
                return value;
            } else
                return modelParent[propToEdit.name];
        },
        set(newValue) {
            if (!modelParent)
                propToEdit.value = newValue;
            else
                modelParent[propToEdit.name] = newValue;
        }
    })//editorModel

    // /**  The root (the ultimate parent) of the (sub)property being edited */
    // let rootProp = propToEdit;
    // const rootPath: string[] = [];
    // while (rootProp.parentPropDescriptor) {
    //     rootPath.unshift(rootProp.name);
    //     rootProp = rootProp.parentPropDescriptor;
    // }//while

    const modelParent = propToEdit.parentPropDescriptor?.value as Record<string, unknown>|undefined;
    // const modelParent = rootPath.slice(0, rootPath.length-1).reduce((acc, pathSeg) => acc[pathSeg], rootProp.value as Record<string, any>);

    /**
     * Builds CSS for the table cell containing (sub-)prop name
     * @param index Subprop index within the subprop list
     */
    function subpropNameCellStyle(index: number) {
        let style = `padding-left: ${subpropLevel + 0.25}rem;`;
        if (typeof propToEdit.value === "object" && index < Object.keys(propToEdit.value!).length-1)
            style += ' border-bottom-style: dotted!important;';
        return style;
    }//subpropNameCellStyle

    /**
     * Bubbles a descendant "add-subprop" event
     * @param where A property to add subprop to
     */
    function onDescendantAddSubprop(where: ElementPropDescriptor)
    {
        emit("add-subprop", where);
    }//onDescendantAddSubprop

    /**
     * Bubbles a descendant "delete-subprop" event
     * @param from A property to add subprop to
     */
    function onDescendantDeleteSubprop(from: ElementPropDescriptor, what: string)
    {
        emit("delete-subprop", from, what);
    }//onDescendantDeleteSubprop

    const cbColorDefined = ref<HTMLInputElement>();
    function onColorDefUndef()
    {
        propToEdit.value = cbColorDefined.value?.checked ? (propToEdit.default ?? "#ffffff") : undefined;
    }//onColorDefUndef

    const valueCellClass = computed(() => {
        return {"text-center": propToEdit.type === Boolean};
    })//valueCellClass

    const urlType = ref(getURLType(propToEdit.subtype === "image-url" ? propToEdit.value as string: undefined));

    function setUrlType(newType: URLType)
    {
        urlType.value = newType;
    }//setUrlType

    async function setGraphicsURL()
    {
        propToEdit.value = await selectOrLoadGraphicsFile(urlType.value);
    }//setGraphicsURL


    const clipboardContent = inject(ikClipboardContent);

    function copyColorToClipboard()
    {
        const color = String(propToEdit.value);
        navigator.clipboard.writeText(color);
        emit("copy-to-clipboard", color)
    }//copyColorToClipboard

    async function pasteColorFromClipboard()
    {
        const color = await navigator.clipboard.readText()
        if (color.match(/#[0-9a-fA-F]{6}/))
            propToEdit.value = color;
    }//pasteColorFromClipboard

    const pasteColorButtonStyle = computed(() => {
        if (clipboardContent?.value.match(/#[0-9a-fA-F]{6}/)) {
            return {
                border: `${clipboardContent.value} solid 3px`
            }
        }//if
        return undefined;
    })//pasteColorButtonStyle

    const addSubpropTitle = computed(() => i18next.t('element-prop-editor.add-subprop', 'Add subproperty'));
    const deleteSubpropTitle = computed(() => i18next.t('element-prop-editor.delete-subprop', 'Delete subproperty'));

    function localizedChoice(i: number)
    {
        if (!propToEdit.validator?.localizedValidValues)
            return propToEdit.validator!.validValues![i];
        return propToEdit.validator.localizedValidValues[i] ?? propToEdit.validator.validValues![i];
    }//localizedChoice
</script>

<template>
    <tr>
        <!-- Prop name -->
        <td class="py-1 pe-1 align-middle" :style="subpropNameCellStyle(subpropIndex)">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-inline-block">
                    <label class="form-label mb-0" :class="{'text-secondary': subpropLevel}" :for="subpropInputID(propToEdit)"
                        :title="propToEdit.localizedDescription || propToEdit.description"
                        @click="isExpanded = !isExpanded"
                        >
                        {{ propToEdit.localizedName || propToEdit.name }}
                    </label>
                    <button type="button" class="btn btn-sm" v-if="propToEdit.type === Object || propToEdit.type === Array"
                            @click="isExpanded = !isExpanded">
                        <span class="material-symbols-outlined">
                            {{`expand_${isExpanded ? "less" : "more"}`}}
                        </span>
                    </button>
                </div>
                <div class="btn-group">
                    <button v-if="propToEdit.isDeletable" type="button" class="btn btn-sm btn-outline-light" 
                            :title="deleteSubpropTitle"
                            @click="emit('delete-subprop', propToEdit.parentPropDescriptor!, propToEdit.name)"
                            >
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    <button v-if="propToEdit.type === Object && withDynamicChildren" type="button" class="btn btn-sm btn-outline-light" 
                            :title="addSubpropTitle" @click="emit('add-subprop', propToEdit)">
                        <span class="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>
        </td>
        <!-- Prop value -->
        <td class="p-1" :class="valueCellClass">
            <select v-if="propToEdit.validator?.validValues" ref="propInputs" :data-prop-name="propToEdit.name"
                    class="form-select form-select-sm border-0" :id="subpropInputID(propToEdit)"
                    v-model="editorModel">
                <option v-if="!propToEdit.required" :value="undefined"></option>
                <option v-for="(choice, i) in propToEdit.validator.validValues" class="text-secondary"
                        :key="`${propToEdit.name}[${i}]`" :value="choice">{{ localizedChoice(i) }}</option>
            </select>
            <template v-else-if="propToEdit.type === Number">
                <input type="number" :id="subpropInputID(propToEdit)"
                    ref="propInputs" :data-prop-name="propToEdit.name"
                    class="form-control form-control-sm text-end border-0"
                    :placeholder="propToEdit.default ? String(propToEdit.default) : undefined"
                    v-model="editorModel"/>
                <input v-if="propToEdit.validator?.min !== undefined && propToEdit.validator.max !== undefined" type="range" class="form-range" 
                    :min="propToEdit.validator.min" :max="propToEdit.validator.max" :step="(propToEdit.validator.max - propToEdit.validator.min)*0.05" 
                    :value="propToEdit.value ?? propToEdit.default" 
                    @input="event => propToEdit.value = (event.target as HTMLInputElement).value">
            </template>
            <input v-else-if="propToEdit.type === Boolean" type="checkbox"
                ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
                class="form-check-input" :indeterminate="propToEdit.value === undefined"
                v-model="editorModel"/>
            <input v-else-if="propToEdit.type === Object"
                ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
                class="form-control form-control-sm text-secondary border-0" readonly
                :value="JSON.stringify(propToEdit.value)"/>
            <div v-else-if="propToEdit.subtype === 'image-url'" class="input-group input-group-sm">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    {{ urlType }}
                </button>
                <ul class="dropdown-menu">
                    <li v-for="ut in URLType" :key="ut" :title="urlTypeDescription(ut)">
                        <a class="dropdown-item" href="#" @click="setUrlType(ut)">{{ ut }}</a>
                    </li>
                </ul>
                <button v-if="urlType !== 'href'" class="btn btn-outline-secondary btn-sm" type="button" @click="setGraphicsURL">
                    <span class="material-symbols-outlined">file_open</span>
                </button>
                <input ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
                    class="form-control form-control-sm"  :disabled="urlType !== URLType.href" 
                    :placeholder="propToEdit.default ? String(propToEdit.default) : undefined" v-model="editorModel"/>
            </div>
            <div v-else-if="propToEdit.subtype === 'color'" class="row">
                <div v-if="!propToEdit.required" class="col-auto">
                    <div class="form-check form-switch form-check-inline d-inline-block">
                        <input class="form-check-input" type="checkbox" ref="cbColorDefined" 
                            :checked="Boolean(propToEdit.value)" @click="onColorDefUndef"/>
                    </div>
                </div>
                <div class="col">
                    <div v-show="propToEdit.value" class="input-group input-group-sm">
                        <button class="btn btn-outline-secondary" type="button" @click="copyColorToClipboard" title="Copy color">
                            <div class="material-symbols-outlined">content_copy</div>
                        </button>
                        <button class="btn btn-outline-secondary" type="button" @click="pasteColorFromClipboard" :style="pasteColorButtonStyle" title="Paste color">
                            <div class="material-symbols-outlined">content_paste</div>
                        </button>
                        <input v-show="propToEdit.value" type="color"
                            ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
                            class="form-control form-control-sm"
                            v-model="editorModel"/>
                    </div>
                </div>
            </div>
            <input v-else 
                ref="propInputs" :data-prop-name="propToEdit.name" :id="subpropInputID(propToEdit)"
                :pattern="propToEdit.validator?.pattern"
                class="form-control form-control-sm border-0"
                :placeholder="propToEdit.default ? String(propToEdit.default) : undefined"
                v-model="editorModel"/>
            <div class="invalid-feedback">
                Syntax error!
            </div>
        </td>
    </tr>
    <!-- Subprops (if exist) -->
    <template v-if="isExpanded && propToEdit.type === Object && propToEdit.value">
        <ElementPropEditor v-for="(subprop, i) in childSubpropDescriptors" 
            :key="`${propToEdit.name}[${subprop.name}]`" 
            :prop-to-edit="subprop" :dlg-new-subprop="dlgNewSubprop" :subprop-level="subpropLevel+1" 
            :subprop-index="i"
            @add-subprop="onDescendantAddSubprop"
            @delete-subprop="onDescendantDeleteSubprop"
            />
    </template>
</template>
