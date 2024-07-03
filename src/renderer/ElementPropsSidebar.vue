<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing drawing elements properties
<*************************************************************************** -->

<script lang="ts">
    import { InjectionKey, Ref, nextTick, provide, ref, watch, onMounted } from 'vue';
    import { Modal, Offcanvas } from 'bootstrap';
    import { DrawingElement, DrawingElementClass, DrawingElementPropCategory,
             NetworkComponent, NetworkComponentClass, 
             NetworkLink, NetworkLinkClass, LinkBundle, LinkBundleClass, KresmerException } from 'kresmer';
    import { kresmer, updateWindowTitle } from './renderer-main';
    import ElementPropEditor, {subpropInputID} from './ElementPropEditor.vue';
    import { DrawingElementClassProp } from 'kresmer/dist/DrawingElement/DrawingElementClass';

    export interface ElementPropDescriptor extends DrawingElementClassProp {
        name: string,
        value: unknown,
        parentPropDescriptor?: ElementPropDescriptor,
        isExpanded: boolean,
    }//ElementPropDescriptor

    export const ikExpansionTrigger = Symbol() as InjectionKey<Ref<ElementPropDescriptor|undefined>>;
    export const ikClipboardContent = Symbol() as InjectionKey<Ref<string>>;

    export default {
        name: "ElementPropsSidebar",
        components: {ElementPropEditor},
    }
</script>

<script setup lang="ts">
    let offCanvas: Offcanvas | undefined;
    const rootDiv = ref<HTMLDivElement>();
    const propInputs = ref<HTMLInputElement[]>();
    const formEnabled = ref(false);
    const formValidated = ref(false);

    let elementToEdit: DrawingElement;
    const elementName = ref<string>("");
    const inpElementName = ref<HTMLInputElement>()!;
    watch(elementName, () => {
        formValidated.value = !validateElementName();
    });
    let dbID: number|string|undefined;

    const expansionTrigger = ref<ElementPropDescriptor|undefined>();
    provide(ikExpansionTrigger, expansionTrigger);

    const clipboardContent = ref("");
    provide(ikClipboardContent, clipboardContent);

    function loadClipboardContent()
    {
        navigator.clipboard.readText().then(content => {
            clipboardContent.value = content;
        })//then
    }//loadClipboardContent

    function triggerClipboardLoading()
    {
        nextTick(loadClipboardContent);
    }//triggerClipboardLoading

    onMounted(loadClipboardContent);

    /**
     * An array of the element props (with values)
     */
     const elementPropDescriptors = ref<ElementPropDescriptor[]>([]);

    /**
     * Displays the sidebars and allows to edit the element
     * @param element An element to edit
     */
     
    function show(element: DrawingElement)
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!, {backdrop: "static", scroll: true});
            rootDiv.value!.addEventListener("hidden.bs.offcanvas", (event) => {
                formEnabled.value = false;
            });
            const el = document.querySelector("#dlgNewSubprop")!;
            el.addEventListener("shown.bs.modal", () => inpNewSubpropName.value!.focus());
            dlgNewSubprop = new Modal(el, {backdrop: "static", keyboard: true});
        }//if

        const classes = 
            element instanceof LinkBundle ? 
                [...kresmer.getRegisteredLinkClasses()].filter(([, _class]) => !_class.isAbstract && _class instanceof LinkBundleClass) : 
            element instanceof NetworkLink ? 
                [...kresmer.getRegisteredLinkClasses()].filter(([, _class]) => !_class.isAbstract && !(_class instanceof LinkBundleClass)) : 
                [...kresmer.getRegisteredComponentClasses()].filter(([name, _class]) => !_class.isAbstract);
        allClasses.value = classes
            .sort((c1, c2) => c1[0] < c2[0] ? -1 : c1[0] > c2[0] ? 1 : 0)
            .map(([name, _class]) => {return {name, _class}});
        elementClass.value = element.getClass();

        elementToEdit = element;
        elementName.value = element.name;
        dbID = element.dbID;
        elementPropDescriptors.value = buildElementPropDescriptors(element.getClass());
        formEnabled.value = true;
        formValidated.value = false;
        offCanvas.show();
    }//show

    const elementClass = ref<DrawingElementClass>();
    const allClasses = ref<{name: string, _class: DrawingElementClass}[]>([]);
    
    function changeClass() {
        const newClass = elementClass.value!;

        if (elementToEdit instanceof NetworkComponent) {
            if (!confirm(`\
Changing component class will disconnect all links connected to it.
Also, the values of the component properties that absent in the new class will be lost.

Continue?`)) {
                elementClass.value = elementToEdit.getClass();
                return;
            }//if
            kresmer.edAPI.changeComponentClass(elementToEdit, newClass as NetworkComponentClass);
        } else if (elementToEdit instanceof NetworkLink) {
            if (!confirm(`\
Changing link class will make the values of the link properties that absent in the new class to be lost.

Continue?`)) {
                elementClass.value = elementToEdit.getClass();
                return;
            }//if
            kresmer.edAPI.changeLinkClass(elementToEdit, newClass as NetworkLinkClass);
        }//if

        elementPropDescriptors.value = buildElementPropDescriptors(newClass);
        formValidated.value = false;
    }//changeClass

    /**
     * Builds an array of the element props (with values)
     * based on element's class  and the values taken from the dialog inputs
     * @param _class An element class
     */
    function buildElementPropDescriptors(_class: DrawingElementClass): ElementPropDescriptor[]
    {
        function clone(x: unknown): unknown
        {
            if (Array.isArray(x))
                return x.map(el => clone(el));
            else if (typeof x === "object") {
                const y: Record<string, unknown> = {};
                for (const k in x) {
                    y[k] = clone(x[k as keyof typeof x]);
                }//for
                return y;
            } else
                return x;
        }//clone

        const descriptors = Object.keys(_class.props)
            .filter(name => _class.props[name].category !== DrawingElementPropCategory.Hidden)
            .map((name): ElementPropDescriptor => 
                {
                    const cl = _class.props[name];
                    return {...cl, name, value: clone(elementToEdit.props[name]), isExpanded: false}
                })
            .sort((p1, p2) => 
                {
                    if (!p1.category && p2.category || (p1.category ?? "") < (p2.category ?? ""))
                        return -1;
                    if (p1.category && !p2.category || (p1.category ?? "") > (p2.category ?? ""))
                        return 1;
                    // if (p1.name < p2.name)
                    //     return -1;
                    // if (p1.name > p2.name)
                    //     return 1;
                    return 0;
                });
        return descriptors;
    }//buildElementPropDescriptors

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

    /** Validates a single prop (after parsing it) and returns its values (if it's found to be valid) or null
     * otherwise. "Undefined" is considered a valid value. */
    function validateProp(prop: ElementPropDescriptor)
    {
        let v: unknown;
        let error: string|undefined;
        switch (prop.type) {
            case Array:
                try {
                    v = JSON.parse(prop.value as string);
                    if (prop.type === Object && typeof v !== "object") {
                        error = "Invalid object syntax";
                    } else if (!Array.isArray(v)) {
                        error = "Invalid array syntax";
                    }//if
                } catch {
                    error = "Invalid object/array syntax";
                }
                break;
            case Number:
                if (prop.value === undefined || prop.value === "") {
                    v = undefined;
                } else {
                    v = parseFloat(prop.value as string);
                    if (isNaN(v as number))
                        error = "Invalid number format";
                }//if
                break;
            default:
                v = prop.value;
        }//switch

        return error ? new KresmerException(error) : v;
    }//validateProp


    /**
     * Saves the updated data to the element
     */
    function save()
    {
        const propsWithErrors = new Map<string, string>();
        for (const prop of elementPropDescriptors.value) {
            const v = validateProp(prop);
            if (v instanceof KresmerException) {
                propsWithErrors.set(prop.name, v.message);
            } else {
                prop.value = v;
            }//if
        }//for

        if (propInputs.value) {
            for (const input of propInputs.value) {
                if (!input.validity.valid) {
                    propsWithErrors.set(input.dataset.propName!, "Syntax error");
                } else if (propsWithErrors.has(input.dataset.propName!)) {
                    input.setCustomValidity(propsWithErrors.get(input.dataset.propName!)!);
                }//if
            }//for
            if (propsWithErrors.size || !validateElementName()) {
                formValidated.value = true;
                return;
            }//if
        }//if

        close();
        elementToEdit.kresmer.edAPI.updateElement(elementToEdit, elementPropDescriptors.value, elementName.value, dbID);
        updateWindowTitle();
    }//save

    /** Closes (hides) the sidebar */
    function close()
    {
        offCanvas!.hide();
        formEnabled.value = false;
    }//close

    /**
     * Adds a new subprop (field) to the given pop
     * @param parentProp A prop to add the subprop to
     * @param type A type of the new subprop
     */
     function addSubprop(parentProp: ElementPropDescriptor, type: "string"|"number"|"boolean"|"object")
    {
        propToAddSubpropTo.value = parentProp;
        newSubpropType.value = type;
        dlgNewSubprop.show();
    }//addSubprop

    /** Callback for completing adding a new field or the Object-type prop */
    function completeAddingSubprop()
    {
        if (!newSubpropName) {
            alert("Subproperty name cannot be empty!");
            return;
        }//if

        if (!propToAddSubpropTo.value!.value) {
            propToAddSubpropTo.value!.value = {};
        }//if
        const parentPropValue = propToAddSubpropTo.value!.value as Record<string, unknown>;

        if (Object.hasOwn(parentPropValue, newSubpropName)) {
            alert(`Subprop "${newSubpropName}" already exists in the prop "${propToAddSubpropTo.value!.name}"`);
            return;
        }//if

        switch (newSubpropType.value) {
            case "string":
                parentPropValue[newSubpropName] = "";
                break;
            case "number":
                parentPropValue[newSubpropName] = 0;
                break;
            case "boolean":
                parentPropValue[newSubpropName] = false;
                break;
            case "object":
                parentPropValue[newSubpropName] = {};
                break;
        }//switch

        dlgNewSubprop.hide();
        expansionTrigger.value = propToAddSubpropTo.value!;
        nextTick(() => {
            const inpToFocus = document.getElementById(subpropInputID(propToAddSubpropTo.value!, newSubpropName)) as HTMLInputElement;
            inpToFocus.focus();
        });
    }//completeAddingSubprop

    let dlgNewSubprop!: Modal;
    const propToAddSubpropTo = ref<ElementPropDescriptor>();
    // eslint-disable-next-line prefer-const
    let newSubpropName = "";
    const inpNewSubpropName = ref<HTMLInputElement>();
    const newSubpropType = ref<"string"|"number"|"boolean"|"object">("string");

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end w-50" style="max-width: 600px;" tabindex="-1"
        @copy="triggerClipboardLoading" @cut="triggerClipboardLoading">
        <!-- Sidebar header -->
        <div class="offcanvas-header align-items-baseline">
            <div>
                <h5 class="offcanvas-title">{{elementName}}</h5>
                <h6 class="text-secondary">
                    <select class="form-select form-select-sm text-secondary" v-model="elementClass" @change="changeClass">
                        <option v-for="ec in allClasses" :value="ec._class" :key="ec.name">{{ec.name}}</option>
                    </select>
                </h6>
            </div>
            <button type="button" class="btn-close" @click="close"></button>
        </div>
        <!-- Sidebar body -->
        <div class="offcanvas-body">
            <form v-if="formEnabled" :class='{"was-validated": formValidated}'>
                <table class="table table-bordered"><tbody>
                    <!-- Element name -->
                    <tr>
                        <td class="align-middle p-1"><label class="form-label mb-0" for="inpElementName">name</label></td>
                        <td class="p-1">
                            <input id="inpElementName" type="text" class="form-control form-control-sm border-0" 
                                    v-model="elementName" ref="inpElementName"/>
                            <div class="invalid-feedback">
                                {{ elementNameValidationMessage }}
                            </div>
                        </td>
                    </tr>
                    <!-- Element DB identifier -->
                    <tr>
                        <td class="align-middle p-1"><label class="form-lable mb-0" for="inpDbID">dbID</label></td>
                        <td class="p-1">
                            <input id="inpDbID" class="form-control form-control-sm border-0" v-model="dbID"/>
                        </td>
                    </tr>
                    <!-- Element props -->
                    <template v-for="(prop, i) in elementPropDescriptors" :key="`prop[${prop.name}]`">
                        <tr v-if="prop.category && (i === 0 || prop.category !== elementPropDescriptors[i-1].category)">
                            <td colspan="2" class="border-0 text-primary text-opacity-75">
                                {{ DrawingElementPropCategory[prop.category] }}
                            </td>
                        </tr>
                        <ElementPropEditor :prop-to-edit="prop" :dlg-new-subprop="dlgNewSubprop" 
                            @add-subprop="addSubprop" 
                            @copy-to-clipboard="data => clipboardContent = data"/>
                    </template>
                </tbody></table>
                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary" @click.prevent="save">Save</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Dialog for adding subprops -->
    <div class="modal" tabindex="-1" id="dlgNewSubprop">
        <div class="modal-dialog">
            <form class="modal-content">
                <div class="modal-header">
                    Adding a&nbsp;<strong>{{ newSubpropType }}</strong>&nbsp;field to the "{{ propToAddSubpropTo?.name }}" prop
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <label class="form-label" for="inpNewSubpropName">Name</label>
                    <input type="text" class="form-control" id="inpNewSubpropName" ref="inpNewSubpropName" v-model="newSubpropName"/>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-sm btn-primary" @click.prevent="completeAddingSubprop">Ok</button>
                    <button type="button" class="btn btn-sm btn-secondary" @click="dlgNewSubprop.hide">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</template>