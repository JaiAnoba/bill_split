"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChannelMessagingFunctions = void 0;
const identifierUtils_1 = require("./identifierUtils");
const sessionStorageUtils_1 = require("./sessionStorageUtils");
const navTreeUtils_1 = require("./navTreeUtils");
// @ts-ignore
const jquery_1 = __importDefault(require("jquery"));
const lodash_1 = __importDefault(require("lodash"));
const outlineUtils_1 = require("./outlineUtils");
const cssFunctions_1 = require("./cssFunctions");
const constantsAndTypes_1 = require("./constantsAndTypes");
const changeItemFunctions_1 = require("./changeItemFunctions");
const resqUtils_1 = require("./resqUtils");
const tempoElement_1 = require("./tempoElement");
const editTextUtils_1 = require("./editTextUtils");
const PIXELS_TO_MOVE_BEFORE_DRAG = 20;
const IMMEDIATELY_REMOVE_POINTER_LOCK = 'IMMEDIATELY_REMOVE_POINTER_LOCK';
const LAST_NAV_TREE_REFRESH_TIME = 'LAST_NAV_TREE_REFRESH_TIME';
// TODO: Change all of this to be a react wrapper library
const initChannelMessagingFunctions = () => {
    // @ts-ignore
    String.prototype.hashCode = function () {
        var hash = 0, i, chr;
        if (this.length === 0)
            return hash;
        for (i = 0; i < this.length; i++) {
            chr = this.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };
    // We want to make event listeners non-passive, and to do so have to check
    // that browsers support EventListenerOptions in the first place.
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
    let passiveSupported = false;
    const makePassiveEventOption = () => {
        try {
            const options = {
                get passive() {
                    // This function will be called when the browser
                    //   attempts to access the passive property.
                    passiveSupported = true;
                    return false;
                },
            };
            return options;
        }
        catch (err) {
            passiveSupported = false;
            return passiveSupported;
        }
    };
    /**
     * Taken from: https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
     *
     * Returns the function to disconnect the observer
     */
    const observeDOM = (function () {
        // @ts-ignore
        var MutationObserver = 
        // @ts-ignore
        window.MutationObserver || window.WebKitMutationObserver;
        return function (obj, callback) {
            if (!obj || obj.nodeType !== 1)
                return () => { };
            if (MutationObserver) {
                // define a new observer
                var mutationObserver = new MutationObserver(callback);
                // have the observer observe foo for changes in children
                mutationObserver.observe(obj, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                });
                return () => {
                    mutationObserver.disconnect();
                };
            }
            // browser support fallback
            // @ts-ignore
            else if (window.addEventListener) {
                obj.addEventListener('DOMNodeInserted', callback, false);
                obj.addEventListener('DOMNodeRemoved', callback, false);
                return () => {
                    obj.removeEventListener('DOMNodeInserted', callback, false);
                    obj.removeEventListener('DOMNodeRemoved', callback, false);
                };
            }
            return () => { };
        };
    })();
    /**
     * When selecting in normal mode (not meta key), can select one level down, a sibling
     * or a parent of the selected element
     */
    const getSelectableNavNode = (e) => {
        const selectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        const selectedElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
        const elementKeyToNavNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE);
        // Move up the tree until you find the first valid nav node
        let firstNavNode = null;
        let searchNode = e.target;
        while (searchNode && !firstNavNode) {
            firstNavNode =
                elementKeyToNavNode[(0, identifierUtils_1.getElementKeyFromNode)(searchNode) || ''];
            searchNode = searchNode.parentElement;
        }
        if (!firstNavNode) {
            return constantsAndTypes_1.SELECT_OR_HOVER_STORYBOARD;
        }
        const isNavNodeMatch = (navTreeNode) => {
            var _a, _b, _c, _d;
            if (selectedElement.isEmpty()) {
                // This function cannot be called if there is no selected element, see code logic below the function
                throw Error('No selected element when isNavNodeMatch called');
            }
            if (!navTreeNode) {
                return false;
            }
            // If there is no codebase ID it should not be selectable as there is nothing we can do with it
            if (!navTreeNode.tempoElement.codebaseId.startsWith('tempo-') ||
                navTreeNode.tempoElement.codebaseId === navTreeUtils_1.SKIP_ROOT_CODEBASE_ID) {
                return false;
            }
            // If it matches, we already passed all possible children, so re-select it
            if (selectedElement.isEqual(navTreeNode.tempoElement)) {
                return true;
            }
            // Any parent is ok to select
            if (navTreeNode.tempoElement.isParentOf(selectedElement)) {
                return true;
            }
            // Check parents
            // Pick the first parent with a codebase ID
            let parent = navTreeNode.parent;
            while (parent && !parent.tempoElement.codebaseId.startsWith('tempo-')) {
                parent = parent.parent;
            }
            // One level down
            if ((_a = parent === null || parent === void 0 ? void 0 : parent.tempoElement) === null || _a === void 0 ? void 0 : _a.isEqual(selectedElement)) {
                return true;
            }
            // Sibling of any parent
            const selectedNode = elementKeyToNavNode[selectedElement.getKey()];
            if (selectedNode &&
                ((_d = (_c = (_b = navTreeNode.parent) === null || _b === void 0 ? void 0 : _b.children) === null || _c === void 0 ? void 0 : _c.includes) === null || _d === void 0 ? void 0 : _d.call(_c, selectedNode))) {
                return true;
            }
            return false;
        };
        let foundNavNode = null;
        let searchNavNode = firstNavNode;
        while (searchNavNode) {
            if (!selectedElement.isEmpty() && !selectedElement.isStoryboard()) {
                // If there is a selected element key loop from this element up the stack to find the element that is the direct child
                // of the expected selected element, so that you can only hover one level deeper than you've selected
                if (isNavNodeMatch(searchNavNode)) {
                    foundNavNode = searchNavNode;
                    // Exit the loop as we found the node that matches
                    break;
                }
            }
            else {
                // If there is no selected element key, or the selection is the storyboard itself, loop up to the top-most element with a codebase ID
                if (searchNavNode.tempoElement.codebaseId &&
                    searchNavNode.tempoElement.codebaseId.startsWith('tempo-')) {
                    foundNavNode = searchNavNode;
                    // Note: we do not exit the loop here as we want to keep searching for the top-most element
                }
            }
            searchNavNode = searchNavNode.parent;
        }
        return foundNavNode || null;
    };
    const onPointerOver = (e, parentPort, storyboardId, selectBottomMostElement) => {
        const passedThrough = passThroughEventsIfNeeded(e, parentPort, storyboardId);
        const editingTextInfo = (0, editTextUtils_1.getEditingInfo)();
        // Allow on pointer over events if editing (so we can click out)
        if (e.altKey || (passedThrough && !editingTextInfo)) {
            return;
        }
        if ((0, sessionStorageUtils_1.getMemoryStorageItem)('mouseDragContext')) {
            return;
        }
        const currentHoveredKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY);
        const elementKeyToNavNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE) || {};
        let hoveredNavNode;
        if (e.metaKey || e.ctrlKey || selectBottomMostElement) {
            const elementKey = (0, identifierUtils_1.getElementKeyFromNode)(e.target);
            hoveredNavNode = elementKeyToNavNode[elementKey];
            // Special case -> this is the top-most node so it should trigger a hover on the storyboard
            if (!hoveredNavNode && e.target.parentNode === document.body) {
                hoveredNavNode = constantsAndTypes_1.SELECT_OR_HOVER_STORYBOARD;
            }
        }
        else {
            hoveredNavNode = getSelectableNavNode(e);
        }
        const currentSelectedKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        const currentSelectedElement = tempoElement_1.TempoElement.fromKey(currentSelectedKey);
        // If the user is holding shift, only allow selecting siblings
        if (e.shiftKey && hoveredNavNode && currentSelectedKey) {
            // Trying to select the entire storyboard, allow only if the other selected element is also a storyboard
            if (typeof hoveredNavNode === 'string' &&
                !currentSelectedElement.isStoryboard()) {
                hoveredNavNode = null;
            }
            if (typeof hoveredNavNode !== 'string' &&
                !(hoveredNavNode === null || hoveredNavNode === void 0 ? void 0 : hoveredNavNode.tempoElement.isSiblingOf(currentSelectedElement))) {
                hoveredNavNode = null;
            }
        }
        if (!hoveredNavNode) {
            if (currentHoveredKey !== null) {
                (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY, null);
                parentPort.postMessage({
                    id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.HOVERED_ELEMENT_KEY,
                    elementKey: null,
                });
                (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
            }
            return;
        }
        if (typeof hoveredNavNode === 'string') {
            if (hoveredNavNode === constantsAndTypes_1.SELECT_OR_HOVER_STORYBOARD) {
                const storyboardKey = tempoElement_1.TempoElement.forStoryboard(storyboardId).getKey();
                if (currentHoveredKey !== storyboardKey) {
                    (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY, storyboardKey);
                    parentPort.postMessage({
                        id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.HOVERED_ELEMENT_KEY,
                        elementKey: storyboardKey,
                    });
                    (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
                }
            }
            return;
        }
        const tempoElementKey = hoveredNavNode.tempoElement.getKey();
        if (currentHoveredKey !== tempoElementKey) {
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.HOVERED_ELEMENT_KEY,
                elementKey: tempoElementKey,
            });
            (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY, tempoElementKey);
            (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
        }
    };
    const clearHoveredElements = (parentPort, storyboardId) => {
        const currentHoveredKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY);
        if (!currentHoveredKey) {
            return;
        }
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.HOVERED_ELEMENT_KEY,
            elementKey: null,
        });
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY, null);
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    const onPointerMove = (e, parentPort, storyboardId) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        passThroughEventsIfNeeded(e, parentPort, storyboardId);
        // If no buttons are pressed the drag end event may not have correctly triggered
        // reset the drag state
        let mouseDragData = (0, sessionStorageUtils_1.getMemoryStorageItem)('mouseDragContext');
        if (!e.buttons && mouseDragData) {
            (0, sessionStorageUtils_1.setMemoryStorageItem)('mouseDragContext', null);
            if (mouseDragData === null || mouseDragData === void 0 ? void 0 : mouseDragData.dragging) {
                parentPort.postMessage({
                    id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.DRAG_CANCEL_EVENT,
                    event: {},
                });
            }
            mouseDragData = null;
        }
        const importantFields = {
            pageX: e.pageX,
            pageY: e.pageY,
            clientX: e.clientX,
            clientY: e.clientY,
        };
        (0, sessionStorageUtils_1.setMemoryStorageItem)('mousePos', importantFields);
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.MOUSE_MOVE_EVENT,
            event: importantFields,
        });
        if (mouseDragData && !mouseDragData.dragging) {
            const zoomPerc = (0, sessionStorageUtils_1.getMemoryStorageItem)('zoomPerc') || 1;
            const totalMovementPixels = Math.abs(mouseDragData.pageX - e.pageX) +
                Math.abs(mouseDragData.pageY - e.pageY);
            // Start the drag event if the user has moved enough
            if (totalMovementPixels >= PIXELS_TO_MOVE_BEFORE_DRAG / zoomPerc) {
                // Reselect the parent if there was one to select
                if (mouseDragData.parentSelectedElementKey) {
                    const elementKeyToNavNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE) || {};
                    const navNodeToSelect = elementKeyToNavNode[mouseDragData.parentSelectedElementKey];
                    if (navNodeToSelect) {
                        parentPort.postMessage({
                            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
                            elementKey: mouseDragData.parentSelectedElementKey,
                            outerHTML: (_a = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${mouseDragData.parentSelectedElementKey}`).get(0)) === null || _a === void 0 ? void 0 : _a.outerHTML,
                        });
                        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, mouseDragData.parentSelectedElementKey);
                    }
                }
                const aiContextSelection = (0, sessionStorageUtils_1.getMemoryStorageItem)('aiContext');
                // Don't enable dragging if the AI context is enabled
                if (!aiContextSelection) {
                    (0, sessionStorageUtils_1.setMemoryStorageItem)('mouseDragContext', Object.assign(Object.assign({}, mouseDragData), { dragging: true }));
                    const selectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
                    const selectedElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectedElementKey}`).get(0);
                    // Trigger the drag start event
                    parentPort.postMessage({
                        id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.DRAG_START_EVENT,
                        event: mouseDragData,
                        outerHTML: selectedElement === null || selectedElement === void 0 ? void 0 : selectedElement.outerHTML,
                    });
                    const bodyObject = (0, jquery_1.default)('body').get(0);
                    // HACK: March 8, 2024
                    // Without this workaround events stay inside the iframe so it's not possible to
                    // track mouse movements outside the iframe when clicking & dragging.
                    // Set the pointer lock and immediately remove it so that
                    // the events start to propagate upwards in the outer application.
                    (0, sessionStorageUtils_1.setMemoryStorageItem)(IMMEDIATELY_REMOVE_POINTER_LOCK, true);
                    yield (bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.requestPointerLock());
                }
            }
        }
        if ((0, sessionStorageUtils_1.getMemoryStorageItem)('mouseDragContext')) {
            (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
        }
    });
    const getParentDomElementForNavNode = (navNode) => {
        if (!navNode) {
            return null;
        }
        if (!(navNode === null || navNode === void 0 ? void 0 : navNode.isComponent)) {
            const childDomElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${navNode.tempoElement.getKey()}`).get(0);
            return childDomElement === null || childDomElement === void 0 ? void 0 : childDomElement.parentElement;
        }
        // This is the list of real DOM elements that are at the top level of this component
        const elementKeyToLookupList = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_LOOKUP_LIST) || {};
        const lookupList = elementKeyToLookupList[navNode.tempoElement.getKey()] || [];
        let childDomElement;
        lookupList.forEach((lookupElementKey) => {
            if (childDomElement) {
                return;
            }
            childDomElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${lookupElementKey}`).get(0);
        });
        return childDomElement === null || childDomElement === void 0 ? void 0 : childDomElement.parentElement;
    };
    const onPointerDown = (e, parentPort, storyboardId) => {
        // This variable determines which button was used
        // 1 -> left, 2 -> middle, 3 -> right
        if (e.which !== 1) {
            return;
        }
        // Allow the edit dynamic text button to be clicked
        if ((0, identifierUtils_1.hasClass)(e.target, identifierUtils_1.EDIT_TEXT_BUTTON)) {
            return;
        }
        const passedThrough = passThroughEventsIfNeeded(e, parentPort, storyboardId);
        if (passedThrough) {
            return;
        }
        const selectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        const selectedElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
        const selectedNavNode = onSelectElement(e, parentPort, storyboardId);
        const useSelectedIfDragging = !selectedElement.isEmpty() &&
            selectedElement.isParentOf(selectedNavNode === null || selectedNavNode === void 0 ? void 0 : selectedNavNode.tempoElement);
        let offsetX, offsetY;
        if (selectedNavNode === null || selectedNavNode === void 0 ? void 0 : selectedNavNode.pageBoundingBox) {
            offsetX =
                selectedNavNode.pageBoundingBox.pageX +
                    selectedNavNode.pageBoundingBox.width / 2 -
                    e.pageX;
            offsetY =
                selectedNavNode.pageBoundingBox.pageY +
                    selectedNavNode.pageBoundingBox.height / 2 -
                    e.pageY;
        }
        const importantFields = {
            pageX: e.pageX,
            pageY: e.pageY,
            // The difference between where the user clicked and the center of the element
            offsetX,
            offsetY,
            // Used to reselect the parent if the user starts to move
            parentSelectedElementKey: useSelectedIfDragging
                ? selectedElementKey
                : null,
        };
        const elementKeyToNavNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE) || {};
        // Get the parent element (actual DOM element) that this node is being dragged inside
        // To do this pick one child element that is being dragged (can be multiple children if the node being dragged is a component),
        // and get its parent in the DOM
        const navNodeToUseForDragging = useSelectedIfDragging
            ? elementKeyToNavNode[selectedElementKey]
            : selectedNavNode;
        const parentDomElement = getParentDomElementForNavNode(navNodeToUseForDragging);
        if (parentDomElement) {
            importantFields['selectedParentDisplay'] = (0, cssFunctions_1.cssEval)(parentDomElement, 'display');
            importantFields['selectedParentFlexDirection'] = (0, cssFunctions_1.cssEval)(parentDomElement, 'flex-direction');
        }
        const aiContextSelection = (0, sessionStorageUtils_1.getMemoryStorageItem)('aiContext');
        // Don't enable dragging if the AI context is enabled
        if (!aiContextSelection) {
            (0, sessionStorageUtils_1.setMemoryStorageItem)('mouseDragContext', importantFields);
        }
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    const onPointerUp = (e, parentPort, storyboardId) => {
        passThroughEventsIfNeeded(e, parentPort, storyboardId);
        const mouseDragData = (0, sessionStorageUtils_1.getMemoryStorageItem)('mouseDragContext');
        (0, sessionStorageUtils_1.setMemoryStorageItem)('mouseDragContext', null);
        if (mouseDragData === null || mouseDragData === void 0 ? void 0 : mouseDragData.dragging) {
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.DRAG_END_EVENT,
                event: {},
            });
        }
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    const onSelectElement = (e, parentPort, storyboardId) => {
        var _a, _b, _c;
        const driveModeEnabled = !!(0, sessionStorageUtils_1.getSessionStorageItem)('driveModeEnabled', storyboardId);
        if (driveModeEnabled) {
            return null;
        }
        const elementKeyToNavNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE) || {};
        let selectedNavNode;
        if (e.metaKey || e.ctrlKey) {
            const elementKey = (0, identifierUtils_1.getElementKeyFromNode)(e.target);
            selectedNavNode = elementKeyToNavNode[elementKey];
            // Special case -> this is the top-most node so it should trigger a select on the storyboard
            if (!selectedNavNode && e.target.parentNode === document.body) {
                selectedNavNode = constantsAndTypes_1.SELECT_OR_HOVER_STORYBOARD;
            }
        }
        else {
            selectedNavNode = getSelectableNavNode(e);
        }
        const currentSelectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        // If this is not a valid nav node, it's not something we track - deselect all
        if (!selectedNavNode) {
            if (currentSelectedElementKey) {
                parentPort.postMessage({
                    id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
                    elementKey: null,
                });
                (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, null);
                (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
            }
            return null;
        }
        const currentSelectedElement = tempoElement_1.TempoElement.fromKey(currentSelectedElementKey);
        const currentMultiSelectedKeys = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS) || [];
        let newSelectedElement = typeof selectedNavNode === 'string'
            ? tempoElement_1.TempoElement.forStoryboard(storyboardId)
            : selectedNavNode.tempoElement;
        let newMultiSelectKeys = [];
        // If the user is holding shift, check if we can multi-select (something has to be already selected)
        // Note: this logic generally matches the logic in the iframe slice on tempo-web
        if (e.shiftKey && currentSelectedElementKey) {
            // First check if we are deselecting
            const elementToDeselect = currentMultiSelectedKeys
                .map((elementKey) => tempoElement_1.TempoElement.fromKey(elementKey))
                .find((element) => {
                return (element.isParentOf(newSelectedElement) ||
                    element.isEqual(newSelectedElement));
            });
            if (elementToDeselect) {
                newMultiSelectKeys = currentMultiSelectedKeys.filter((elementKey) => {
                    return elementKey !== elementToDeselect.getKey();
                });
                // Pick a new element to be the main selected element
                // Note, if the length is 1, there is logic further down to handle that case explicitly (to exit multiselect mode)
                if (elementToDeselect.isEqual(currentSelectedElement) &&
                    newMultiSelectKeys.length > 1) {
                    parentPort.postMessage({
                        id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
                        elementKey: newMultiSelectKeys[0],
                        outerHTML: (_a = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${newMultiSelectKeys[0]}`).get(0)) === null || _a === void 0 ? void 0 : _a.outerHTML,
                    });
                    (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, newMultiSelectKeys[0]);
                }
                // Check if we can add this element
            }
            else if (currentSelectedElement.isSiblingOf(newSelectedElement)) {
                if (currentMultiSelectedKeys === null || currentMultiSelectedKeys === void 0 ? void 0 : currentMultiSelectedKeys.length) {
                    newMultiSelectKeys = currentMultiSelectedKeys.concat([
                        newSelectedElement.getKey(),
                    ]);
                }
                else {
                    newMultiSelectKeys = [
                        currentSelectedElementKey,
                        newSelectedElement.getKey(),
                    ];
                }
            }
            else {
                // This case the user is trying to multiselect but it's not something that's allowed, just return but don't make any changes
                return null;
            }
        }
        // In multiselect mode, set the necessary values
        if (newMultiSelectKeys.length > 1) {
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.MULTI_SELECTED_ELEMENT_KEYS,
                elementKeys: newMultiSelectKeys,
                outerHTMLs: newMultiSelectKeys === null || newMultiSelectKeys === void 0 ? void 0 : newMultiSelectKeys.map((elementKey) => { var _a; return (_a = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${elementKey}`).get(0)) === null || _a === void 0 ? void 0 : _a.outerHTML; }),
            });
            (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS, newMultiSelectKeys);
            (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
            (0, editTextUtils_1.teardownEditableText)(parentPort, storyboardId);
            return null; // Cannot perform regular actions on any particular node
        }
        // Special case - multiselecting but deselecting down to 1, stop the multiselect mode
        if (newMultiSelectKeys.length === 1) {
            newSelectedElement = tempoElement_1.TempoElement.fromKey(newMultiSelectKeys[0]);
        }
        const clearMultiSelectState = () => {
            // Not multi-selecting, so clear the multiselect state
            // Want to do this after setting the selected element to prevent flashing
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.MULTI_SELECTED_ELEMENT_KEYS,
                elementKeys: [],
                outerHTMLs: [],
            });
            (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS, null);
        };
        // Selecting the storyboard from within
        if (newSelectedElement.isStoryboard()) {
            if (newSelectedElement.getKey() !== currentSelectedElementKey) {
                parentPort.postMessage({
                    id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
                    elementKey: newSelectedElement.getKey(),
                    outerHTML: (_b = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${newSelectedElement.getKey()}`).get(0)) === null || _b === void 0 ? void 0 : _b.outerHTML,
                });
                (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, newSelectedElement.getKey());
                (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
            }
            (0, editTextUtils_1.teardownEditableText)(parentPort, storyboardId);
            clearMultiSelectState();
            return null;
        }
        if ((0, editTextUtils_1.currentlyEditing)()) {
            const editingInfo = (0, editTextUtils_1.getEditingInfo)();
            if ((editingInfo === null || editingInfo === void 0 ? void 0 : editingInfo.key) !== currentSelectedElementKey) {
                (0, editTextUtils_1.teardownEditableText)(parentPort, storyboardId);
            }
            clearMultiSelectState();
            return null;
        }
        e.preventDefault();
        e.stopPropagation();
        if ((0, editTextUtils_1.canEditText)(newSelectedElement) &&
            newSelectedElement.getKey() === currentSelectedElementKey) {
            (0, editTextUtils_1.setupEditableText)(newSelectedElement, parentPort, storyboardId);
        }
        if (newSelectedElement.getKey() === currentSelectedElementKey) {
            clearMultiSelectState();
            return selectedNavNode;
        }
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
            elementKey: newSelectedElement.getKey(),
            outerHTML: (_c = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${newSelectedElement.getKey()}`).get(0)) === null || _c === void 0 ? void 0 : _c.outerHTML,
        });
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, newSelectedElement.getKey());
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
        clearMultiSelectState();
        return selectedNavNode;
    };
    /**
     * Returns if events were passed through
     */
    const passThroughEventsIfNeeded = (e, parentPort, storyboardId) => {
        var _a, _b;
        const driveModeEnabled = !!(0, sessionStorageUtils_1.getSessionStorageItem)('driveModeEnabled', storyboardId);
        const editingTextInfo = (0, editTextUtils_1.getEditingInfo)();
        if (driveModeEnabled || editingTextInfo) {
            return true;
        }
        (_a = e === null || e === void 0 ? void 0 : e.preventDefault) === null || _a === void 0 ? void 0 : _a.call(e);
        (_b = e === null || e === void 0 ? void 0 : e.stopPropagation) === null || _b === void 0 ? void 0 : _b.call(e);
        return false;
    };
    const onClickElementContextMenu = (e, parentPort, storyboardId) => {
        var _a;
        const passedThrough = passThroughEventsIfNeeded(e, parentPort, storyboardId);
        if (passedThrough) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        // Mouse down is called when a user clicks the context menu, but not mouse up, so clear the mouse down
        (0, sessionStorageUtils_1.setMemoryStorageItem)('mouseDragContext', null);
        const elementKeyToNavNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE) || {};
        let requestedNavNode;
        if (e.metaKey || e.ctrlKey) {
            const elementKey = (0, identifierUtils_1.getElementKeyFromNode)(e.target);
            requestedNavNode = elementKeyToNavNode[elementKey];
            // Special case -> this is the top-most node so it should trigger a context menu on the storyboard
            if (!requestedNavNode && e.target.parentNode === document.body) {
                requestedNavNode = constantsAndTypes_1.SELECT_OR_HOVER_STORYBOARD;
            }
        }
        else {
            requestedNavNode = getSelectableNavNode(e);
        }
        const currentSelectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        const currentMultiSelectedKeys = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS);
        if (!requestedNavNode || typeof requestedNavNode === 'string') {
            if (requestedNavNode === constantsAndTypes_1.SELECT_OR_HOVER_STORYBOARD &&
                !(currentMultiSelectedKeys === null || currentMultiSelectedKeys === void 0 ? void 0 : currentMultiSelectedKeys.length)) {
                const storyboardKey = tempoElement_1.TempoElement.forStoryboard(storyboardId).getKey();
                if (currentSelectedElementKey === storyboardKey) {
                    return;
                }
                parentPort.postMessage({
                    id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
                    elementKey: storyboardKey,
                });
                (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, storyboardKey);
                (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
            }
            return;
        }
        let contextRequestedElementKey = null;
        const selectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        const selectedElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
        // Don't select any children as the user might be right clicking a node they selected
        if (!requestedNavNode.tempoElement.isEqual(selectedElement) &&
            !selectedElement.isParentOf(requestedNavNode.tempoElement) &&
            !(currentMultiSelectedKeys === null || currentMultiSelectedKeys === void 0 ? void 0 : currentMultiSelectedKeys.length) // Also don't select anything new if in multiselect mode
        ) {
            contextRequestedElementKey = requestedNavNode.tempoElement.getKey();
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
                elementKey: contextRequestedElementKey,
                outerHTML: (_a = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${contextRequestedElementKey}`).get(0)) === null || _a === void 0 ? void 0 : _a.outerHTML,
            });
            (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, contextRequestedElementKey);
            (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
        }
        const importantFields = {
            clientX: e.clientX,
            clientY: e.clientY,
        };
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.CONTEXT_REQUESTED,
            event: importantFields,
        });
    };
    const buildAndSendNavTree = (parentPort, storyboardId, treeElementLookup, scopeLookup, storyboardComponentElement) => {
        let treeElements = treeElementLookup;
        if (!treeElements) {
            treeElements = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.TREE_ELEMENT_LOOKUP) || {};
        }
        let scopes = scopeLookup;
        if (!scopes) {
            scopes = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SCOPE_LOOKUP) || {};
        }
        let storyboardComponent = storyboardComponentElement;
        if (storyboardComponentElement === 'EXPLICIT_NONE') {
            storyboardComponent = null;
        }
        else if (!storyboardComponent) {
            storyboardComponent = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.STORYBOARD_COMPONENT) || {};
        }
        const rootReactElement = (0, resqUtils_1.getRootReactElement)();
        const reactTree = (0, resqUtils_1.buildNodeTree)(rootReactElement, null);
        const lookupIdToReactTreeMap = {};
        (0, resqUtils_1.buildTreeLookupMap)(reactTree, lookupIdToReactTreeMap);
        const knownComponentNames = new Set();
        const knownComponentInstanceNames = new Set();
        if (treeElements) {
            Object.values(treeElements).forEach((treeElement) => {
                if (treeElement.type === 'component' ||
                    treeElement.type === 'storybook-component') {
                    knownComponentNames.add(treeElement.componentName);
                }
                if (treeElement.type === 'component-instance') {
                    knownComponentInstanceNames.add(treeElement.componentName);
                }
            });
        }
        const elementKeyToLookupList = {};
        const elementKeyToNavNode = {};
        const builtNavTree = (0, navTreeUtils_1.buildNavForNode)(storyboardId, undefined, (0, jquery_1.default)('body').get(0), '', 'root', scopes, treeElements, lookupIdToReactTreeMap, knownComponentNames, knownComponentInstanceNames, elementKeyToLookupList, elementKeyToNavNode);
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_LOOKUP_LIST, elementKeyToLookupList);
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.CURRENT_NAV_TREE, builtNavTree);
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE, elementKeyToNavNode);
        (0, resqUtils_1.clearLookupsFromTree)(reactTree);
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.NAV_TREE,
            navTree: builtNavTree,
            outerHtml: document.documentElement.outerHTML,
        });
        // Run callbacks
        (0, navTreeUtils_1.runNavTreeBuiltCallbacks)();
    };
    const onFlushStart = () => {
        // Find all instant update styling classes to delete
        const classesToDelete = [];
        (0, jquery_1.default)(`*[class*=${identifierUtils_1.TEMPO_INSTANT_UPDATE_STYLING_PREFIX}]`).each((i, element) => {
            const classes = (element.getAttribute('class') || '').split(' ');
            classes.forEach((className) => {
                if (className.startsWith(identifierUtils_1.TEMPO_INSTANT_UPDATE_STYLING_PREFIX)) {
                    classesToDelete.push(className);
                }
            });
        });
        (0, jquery_1.default)(`*[${identifierUtils_1.TEMPO_DELETE_AFTER_REFRESH}=true]`).attr(identifierUtils_1.TEMPO_QUEUE_DELETE_AFTER_HOT_RELOAD, 'true');
        // Clear the add class instant update queue as those items will be applied in the hot reload
        (0, sessionStorageUtils_1.setMemoryStorageItem)(changeItemFunctions_1.ADD_CLASS_INSTANT_UPDATE_QUEUE, []);
        (0, sessionStorageUtils_1.setMemoryStorageItem)('POST_HOT_RELOAD_CLEAR', {
            classesToDelete,
        });
    };
    const clearInstantUpdatesAndSendNavTree = (parentPort, storyboardId) => {
        (0, sessionStorageUtils_1.setMemoryStorageItem)(LAST_NAV_TREE_REFRESH_TIME, new Date());
        const { classesToDelete } = (0, sessionStorageUtils_1.getMemoryStorageItem)('POST_HOT_RELOAD_CLEAR') || {};
        // Delete all instant update changed elements
        (0, jquery_1.default)(`*[${identifierUtils_1.TEMPO_QUEUE_DELETE_AFTER_HOT_RELOAD}=true]`).remove();
        // Clear the added display nones
        (0, jquery_1.default)(`.${identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS}`).removeClass(identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS);
        (0, jquery_1.default)(`*[${identifierUtils_1.TEMPO_INSTANT_UPDATE}=true]`).removeAttr(identifierUtils_1.TEMPO_INSTANT_UPDATE);
        (0, jquery_1.default)(`*[${identifierUtils_1.TEMPO_DO_NOT_SHOW_IN_NAV_UNTIL_REFRESH}=true]`).removeAttr(identifierUtils_1.TEMPO_DO_NOT_SHOW_IN_NAV_UNTIL_REFRESH);
        (0, jquery_1.default)(`.${changeItemFunctions_1.TEMPORARY_STYLING_CLASS_NAME}`).removeClass(changeItemFunctions_1.TEMPORARY_STYLING_CLASS_NAME);
        // Any classes marked to delete before the hot reload
        classesToDelete === null || classesToDelete === void 0 ? void 0 : classesToDelete.forEach((cls) => {
            (0, jquery_1.default)(`.${cls}`).removeClass(cls);
        });
        const newAddClassQueue = (0, sessionStorageUtils_1.getMemoryStorageItem)(changeItemFunctions_1.ADD_CLASS_INSTANT_UPDATE_QUEUE) || [];
        // Any attributes that start with the styling prefix leftover mean that the class needs to be re-applied
        // these are classes that were added in instant updates while the hot reload was in progress
        newAddClassQueue.forEach((item) => {
            if (!item) {
                return;
            }
            const { codebaseId, className } = item;
            if (codebaseId && className) {
                (0, jquery_1.default)(`.${codebaseId}`).attr(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true');
                (0, jquery_1.default)(`.${codebaseId}`).addClass(className);
            }
        });
        // Rebuild the nav tree on DOM changed after some time has passed
        // this gives the react fiber time to be fully reconciled
        try {
            setTimeout(() => {
                buildAndSendNavTree(parentPort, storyboardId);
                (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
            }, 300);
        }
        catch (e) {
            console.error('ERROR: Could not re-create nav tree on DOM change, ' + e);
        }
    };
    const onDOMChanged = (mutations, parentPort, storyboardId, 
    // If set to true this is called from the shadow root for the nextjs build watcher (the spinning triangle)
    fromNextJsLoader) => {
        var _a;
        // Udpate the href in the parent container
        if ((0, sessionStorageUtils_1.getMemoryStorageItem)('href') !== window.location.href) {
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.LATEST_HREF,
                href: window.location.href,
            });
            (0, sessionStorageUtils_1.setMemoryStorageItem)('href', window.location.href);
        }
        // Check if we should refresh the nav tree
        let refreshNavTree = false;
        if (fromNextJsLoader) {
            // From the nextjs loader, refresh when the loader gets hidden (means refresh is done)
            const mutationTarget = (_a = mutations === null || mutations === void 0 ? void 0 : mutations[0]) === null || _a === void 0 ? void 0 : _a.target;
            if (mutationTarget && mutationTarget.id === 'container') {
                const currentlyHotReloading = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.HOT_RELOADING);
                if (mutationTarget.classList.contains('visible')) {
                    (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.HOT_RELOADING, true);
                }
                else {
                    (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.HOT_RELOADING, false);
                    refreshNavTree = true;
                }
            }
        }
        else {
            mutations.forEach((e) => {
                // If the class attribute has changed on an element we have to reparse the nav tree to add the element key
                if (e.type === 'attributes' &&
                    e.attributeName === 'class' &&
                    e.target &&
                    !(0, outlineUtils_1.isNodeOutline)(e.target) &&
                    !(0, identifierUtils_1.isMovingElement)(e.target) &&
                    // And not a script
                    // Bug found on Oct 8, 2024, for some reason the script kept triggering a reload
                    !e.target.tagName.toLowerCase().includes('script')) {
                    const elementKey = (0, identifierUtils_1.getElementKeyFromNode)(e.target);
                    const uniqueLookup = (0, identifierUtils_1.getUniqueLookupFromNode)(e.target);
                    // An element which doesn't have an element key has changed
                    if (!elementKey && !uniqueLookup && !(0, identifierUtils_1.isElementInSvg)(e.target)) {
                        refreshNavTree = true;
                    }
                    return;
                }
                [e.addedNodes, e.removedNodes].forEach((nodeList) => {
                    if (!nodeList) {
                        return;
                    }
                    nodeList.forEach((node) => {
                        if (!(0, outlineUtils_1.isNodeOutline)(node) && !(0, identifierUtils_1.isMovingElement)(node)) {
                            refreshNavTree = true;
                        }
                    });
                });
            });
        }
        if (!refreshNavTree) {
            return;
        }
        // In these cases we don't want to trigger a nav tree refresh right away
        // since the hot reload may not have happened yet. So we set a timeout and only
        // trigger a nav tree refresh if another one hasn't happened in between
        if (fromNextJsLoader) {
            const triggerTime = new Date();
            setTimeout(() => {
                const lastRefreshTime = (0, sessionStorageUtils_1.getMemoryStorageItem)(LAST_NAV_TREE_REFRESH_TIME);
                // Don't re-clear and send if another refresh has happened in the meantime
                if (!lastRefreshTime || lastRefreshTime < triggerTime) {
                    clearInstantUpdatesAndSendNavTree(parentPort, storyboardId);
                }
            }, 1000);
            return;
        }
        clearInstantUpdatesAndSendNavTree(parentPort, storyboardId);
    };
    const onWheel = (e, parentPort, storyboardId) => {
        const passedThrough = passThroughEventsIfNeeded(e, parentPort, storyboardId);
        const isScrollShortcut = e.altKey;
        const isZoomShortcut = e.ctrlKey || e.metaKey;
        // If the user wants to scroll (either by being in drive mode, or by holding alt)
        // and they aren't trying to zoom, fallback to default behaviour.
        if (!isZoomShortcut && (passedThrough || isScrollShortcut)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const importantFields = {
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            wheelDelta: e.wheelDelta,
            x: e.x,
            y: e.y,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
        };
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.WHEEL_EVENT,
            event: importantFields,
        });
    };
    const activeElementMetadata = () => {
        const activeElement = document.activeElement;
        let tagName, isContentEditable, elementType;
        if (activeElement) {
            tagName = activeElement.tagName;
            if (activeElement instanceof HTMLElement) {
                isContentEditable = activeElement.isContentEditable;
            }
            if (activeElement instanceof HTMLInputElement) {
                elementType = activeElement.type;
            }
        }
        return {
            tagName: tagName,
            isContentEditable: isContentEditable,
            elementType: elementType,
        };
    };
    const onKeyDown = (e, parentPort) => {
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.KEY_DOWN_EVENT,
            event: {
                key: e.key,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                activeElement: Object.assign({}, activeElementMetadata()),
            },
        });
    };
    const onKeyUp = (e, parentPort) => {
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.KEY_UP_EVENT,
            event: {
                key: e.key,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                activeElement: Object.assign({}, activeElementMetadata()),
            },
        });
    };
    const throttledUpdateOutlines = lodash_1.default.throttle((parentPort, storyboardId) => (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId), 15);
    const onScroll = (e, parentPort, storyboardId) => {
        throttledUpdateOutlines(parentPort, storyboardId);
    };
    // Need to register functions on the window for channel messaging to use them
    // @ts-ignore
    window.initProject = (parentPort, storyboardId, treeElementLookup, scopeLookup, storyboardComponentElement, options = {}, storyboardType, savedComponentFilename, originalStoryboardUrl) => {
        const passive = makePassiveEventOption();
        passive['capture'] = true;
        const body$ = (0, jquery_1.default)('body');
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.TREE_ELEMENT_LOOKUP, treeElementLookup);
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SCOPE_LOOKUP, scopeLookup);
        if (storyboardComponentElement) {
            (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.STORYBOARD_COMPONENT, storyboardComponentElement);
        }
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.STORYBOARD_TYPE, storyboardType);
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SAVED_STORYBOARD_COMPONENT_FILENAME, savedComponentFilename);
        // The URL that was originally loaded for this storyboard, it may be different from href
        // if the user navigated away to a new route
        if (originalStoryboardUrl) {
            (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.ORIGINAL_STORYBOARD_URL, originalStoryboardUrl);
        }
        // Clear iframe outlines
        (0, sessionStorageUtils_1.removeMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        (0, sessionStorageUtils_1.removeMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY);
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
        // Register event listeners
        const bodyObject = body$.get(0);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('click', (e) => {
            passThroughEventsIfNeeded(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('pointerover', (e) => {
            onPointerOver(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('pointerdown', (e) => {
            onPointerDown(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('pointerup', (e) => {
            onPointerUp(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('pointermove', (e) => {
            onPointerMove(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('pointerleave', (e) => {
            passThroughEventsIfNeeded(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('contextmenu', (e) => {
            onClickElementContextMenu(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('dblclick', (e) => {
            passThroughEventsIfNeeded(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('mouseover', (e) => {
            passThroughEventsIfNeeded(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('mouseout', (e) => {
            passThroughEventsIfNeeded(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('mousemove', (e) => {
            passThroughEventsIfNeeded(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('mousedown', (e) => {
            passThroughEventsIfNeeded(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('mouseup', (e) => {
            passThroughEventsIfNeeded(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('wheel', (e) => {
            onWheel(e, parentPort, storyboardId);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('keydown', (e) => {
            onKeyDown(e, parentPort);
        }, passive);
        bodyObject === null || bodyObject === void 0 ? void 0 : bodyObject.addEventListener('keyup', (e) => {
            onKeyUp(e, parentPort);
        }, passive);
        window.addEventListener('scroll', (e) => {
            onScroll(e, parentPort, storyboardId);
        }, passive);
        // Hack: this is used to
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement &&
                (0, sessionStorageUtils_1.getMemoryStorageItem)(IMMEDIATELY_REMOVE_POINTER_LOCK)) {
                document.exitPointerLock();
                (0, sessionStorageUtils_1.setMemoryStorageItem)(IMMEDIATELY_REMOVE_POINTER_LOCK, false);
            }
        }, false);
        observeDOM(bodyObject, (e) => {
            onDOMChanged(e, parentPort, storyboardId);
        });
        // If this is NextJS, also listen to the shadow root of the __next-build-watcher
        // This triggeres the onDOMChanged when the hot reload symbol shows up
        const nextBuildWatcher = document.getElementById('__next-build-watcher');
        if (nextBuildWatcher && nextBuildWatcher.shadowRoot) {
            Array.from(nextBuildWatcher.shadowRoot.children).forEach((child) => {
                observeDOM(child, (e) => {
                    onDOMChanged(e, parentPort, storyboardId, true);
                });
            });
        }
        if (options.driveModeEnabled) {
            enableDriveMode(parentPort, storyboardId);
        }
        else {
            disableDriveMode(parentPort, storyboardId);
        }
        if (options.aiContextSelection) {
            (0, sessionStorageUtils_1.setMemoryStorageItem)('aiContext', true);
            (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
        }
        else {
            (0, sessionStorageUtils_1.setMemoryStorageItem)('aiContext', false);
            (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
        }
        // Build the Nav Tree and send it back
        try {
            buildAndSendNavTree(parentPort, storyboardId, treeElementLookup, scopeLookup, storyboardComponentElement || 'EXPLICIT_NONE');
        }
        catch (e) {
            console.log(e);
            console.error('Error building nav tree: ' + e);
        }
    };
    const enableDriveMode = (parentPort, storyboardId) => {
        // @ts-ignore
        if (!(0, sessionStorageUtils_1.getSessionStorageItem)('driveModeEnabled', storyboardId)) {
            // @ts-ignore
            (0, sessionStorageUtils_1.setSessionStorageItem)('driveModeEnabled', 'enabled', storyboardId);
            clearHoveredElements(parentPort, storyboardId);
            (0, outlineUtils_1.clearAllOutlines)();
        }
        (0, jquery_1.default)('body').css('cursor', '');
    };
    const disableDriveMode = (parentPort, storyboardId) => {
        // @ts-ignore
        if ((0, sessionStorageUtils_1.getSessionStorageItem)('driveModeEnabled', storyboardId)) {
            // @ts-ignore
            (0, sessionStorageUtils_1.removeSessionStorageItem)('driveModeEnabled', storyboardId);
            (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
            clearHoveredElements(parentPort, storyboardId);
        }
        (0, jquery_1.default)('body').attr('style', function (i, s) {
            return (s || '') + 'cursor: default !important;';
        });
    };
    // @ts-ignore
    window.enableDriveMode = (parentPort, storyboardId) => {
        enableDriveMode(parentPort, storyboardId);
    };
    // @ts-ignore
    window.disableDriveMode = (parentPort, storyboardId) => {
        disableDriveMode(parentPort, storyboardId);
    };
    // @ts-ignore
    window.setNewLookups = (parentPort, storyboardId, treeElementLookup, scopeLookup) => {
        const prevTreeElemntLookup = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.TREE_ELEMENT_LOOKUP) || {};
        const prevScopeLookup = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SCOPE_LOOKUP) || {};
        const newTreeElements = Object.assign({}, prevTreeElemntLookup);
        // Delete any tree elements that were set to nul
        Object.keys(treeElementLookup).forEach((key) => {
            if (treeElementLookup[key]) {
                newTreeElements[key] = treeElementLookup[key];
            }
            else if (newTreeElements[key]) {
                delete newTreeElements[key];
            }
        });
        const newScopes = Object.assign({}, prevScopeLookup);
        // Delete any scopes that were set to nul
        Object.keys(scopeLookup).forEach((key) => {
            if (scopeLookup[key]) {
                newScopes[key] = scopeLookup[key];
            }
            else if (newScopes[key]) {
                delete newScopes[key];
            }
        });
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.TREE_ELEMENT_LOOKUP, newTreeElements);
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SCOPE_LOOKUP, newScopes);
    };
    // @ts-ignore
    window.setHoveredElement = (parentPort, storyboardId, elementKey) => {
        const driveModeEnabled = !!(0, sessionStorageUtils_1.getSessionStorageItem)('driveModeEnabled', storyboardId);
        if (driveModeEnabled) {
            return;
        }
        const prevHoveredElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY);
        if (prevHoveredElementKey === elementKey) {
            return;
        }
        if (elementKey) {
            (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY, elementKey);
        }
        else {
            (0, sessionStorageUtils_1.removeMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY);
        }
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.setSelectedElement = (parentPort, storyboardId, elementKey) => {
        var _a, _b;
        const prevSelectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        if (prevSelectedElementKey === elementKey) {
            return;
        }
        if (elementKey) {
            const tempoElement = tempoElement_1.TempoElement.fromKey(elementKey);
            let elementKeyToExtract = elementKey;
            if (tempoElement.isStoryboard(storyboardId)) {
                // Pass back the outerHTML of the top level node
                const topLevelNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.CURRENT_NAV_TREE);
                const topLevelElementKey = (_a = topLevelNode === null || topLevelNode === void 0 ? void 0 : topLevelNode.tempoElement) === null || _a === void 0 ? void 0 : _a.getKey();
                if (topLevelElementKey) {
                    elementKeyToExtract = topLevelElementKey;
                }
            }
            // Send back the message just to set the outerHTML only
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
                doNotSetElementKey: true,
                outerHTML: (_b = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${elementKeyToExtract}`).get(0)) === null || _b === void 0 ? void 0 : _b.outerHTML,
            });
            (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, elementKey);
        }
        else {
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
                doNotSetElementKey: true,
                outerHTML: null,
            });
            (0, sessionStorageUtils_1.removeMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        }
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.setMultiselectedElementKeys = (parentPort, storyboardId, elementKeys) => {
        const prevMultiSelectedElementKeys = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS);
        const prevSet = new Set(prevMultiSelectedElementKeys || []);
        const newSet = new Set(elementKeys || []);
        const setsEqual = prevSet.size === newSet.size &&
            [...prevSet].every((value) => newSet.has(value));
        if (setsEqual) {
            return;
        }
        if (elementKeys) {
            (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS, elementKeys);
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.MULTI_SELECTED_ELEMENT_KEYS,
                doNotSetElementKeys: true,
                outerHTMLs: elementKeys === null || elementKeys === void 0 ? void 0 : elementKeys.map((elementKey) => { var _a; return (_a = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${elementKey}`).get(0)) === null || _a === void 0 ? void 0 : _a.outerHTML; }),
            });
        }
        else {
            (0, sessionStorageUtils_1.removeMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS);
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.MULTI_SELECTED_ELEMENT_KEYS,
                doNotSetElementKeys: true,
                outerHTMLs: [],
            });
        }
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.processRulesForSelectedElement = (parentPort, storyboardId, cssElementLookup, selectedElementKey) => {
        (0, cssFunctions_1.processRulesForSelectedElement)(parentPort, cssElementLookup, selectedElementKey);
    };
    // @ts-ignore
    window.setModifiersForSelectedElement = (parentPort, storyboardId, modifiers, selectedElementKey) => {
        (0, cssFunctions_1.setModifiersForSelectedElement)(parentPort, modifiers, selectedElementKey);
    };
    // @ts-ignore
    window.getCssEvals = (parentPort, storyboardId, selectedElementKey) => {
        (0, cssFunctions_1.getCssEvals)(parentPort, selectedElementKey);
    };
    // @ts-ignore
    window.ruleMatchesElement = (parentPort, storyboardId, messageId, rule, selectedElementKey) => {
        (0, cssFunctions_1.ruleMatchesElement)(parentPort, messageId, rule, selectedElementKey);
    };
    // @ts-ignore
    window.getElementClassList = (parentPort, storyboardId, selectedElementKey) => {
        (0, cssFunctions_1.getElementClassList)(parentPort, selectedElementKey);
    };
    // @ts-ignore
    window.applyChangeItemToDocument = (parentPort, storyboardId, changeItem) => __awaiter(void 0, void 0, void 0, function* () {
        const { sendNewNavTree } = (0, changeItemFunctions_1.applyChangeItemToDocument)(parentPort, storyboardId, changeItem);
        // Update the nav tree & outlines
        if (sendNewNavTree) {
            buildAndSendNavTree(parentPort, storyboardId);
        }
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    });
    // @ts-ignore
    window.updateCodebaseIds = (parentPort, storyboardId, prevIdToNewIdMap, newTreeElementLookup, newScopeLookup) => {
        const sendNewNavTree = (0, changeItemFunctions_1.updateCodebaseIds)(parentPort, prevIdToNewIdMap, true);
        if (sendNewNavTree) {
            buildAndSendNavTree(parentPort, storyboardId, newTreeElementLookup, newScopeLookup);
        }
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.dispatchEvent = (parentPort, storyboardId, eventName, eventDetails) => {
        const event = new CustomEvent(eventName, Object.assign({}, eventDetails));
        document.dispatchEvent(event);
    };
    // @ts-ignore
    window.updateOutlines = (parentPort, storyboardId) => {
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.goBack = (parentPort, storyboardId) => {
        if (document.referrer !== '') {
            window.history.back();
        }
    };
    // @ts-ignore
    window.goForward = (parentPort, storyboardId) => {
        window.history.forward();
    };
    // @ts-ignore
    window.refresh = (parentPort, storyboardId) => {
        window.location.reload();
    };
    // @ts-ignore
    window.syntheticMouseOver = (parentPort, storyboardId, coords, dontHoverInsideSelected, selectBottomMostElement) => {
        const target = document.elementFromPoint(coords.x, coords.y);
        // If this is true we don't want to trigger a hover event inside a selected element, instead just set hovering on the selected element
        if (dontHoverInsideSelected) {
            const selectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
            const selectedElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
            if (!selectedElement.isEmpty()) {
                const selectedDomElement = document.querySelector(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectedElementKey}`);
                if (selectedDomElement === null || selectedDomElement === void 0 ? void 0 : selectedDomElement.contains(target)) {
                    onPointerOver({ target: selectedDomElement }, parentPort, storyboardId);
                    return;
                }
            }
        }
        onPointerOver({ target }, parentPort, storyboardId, selectBottomMostElement);
    };
    // @ts-ignore
    window.syntheticMouseMove = (parentPort, storyboardId, syntheticEvent) => {
        const eventWithClient = Object.assign(Object.assign({}, syntheticEvent), { pageX: syntheticEvent.clientX +
                (document.documentElement.scrollLeft || document.body.scrollLeft), pageY: syntheticEvent.clientY +
                (document.documentElement.scrollTop || document.body.scrollTop) });
        onPointerMove(eventWithClient, parentPort, storyboardId);
    };
    // @ts-ignore
    window.syntheticMouseUp = (parentPort, storyboardId, syntheticEvent) => {
        onPointerUp(syntheticEvent, parentPort, storyboardId);
    };
    // @ts-ignore
    window.clearHoveredOutlines = (parentPort, storyboardId) => {
        if ((0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY)) {
            clearHoveredElements(parentPort, storyboardId);
        }
    };
    // @ts-ignore
    window.setZoomPerc = (parentPort, storyboardId, zoomPerc) => {
        (0, sessionStorageUtils_1.setMemoryStorageItem)('zoomPerc', zoomPerc.toString());
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.setAiContext = (parentPort, storyboardId, aiContext) => {
        (0, sessionStorageUtils_1.setMemoryStorageItem)('aiContext', !!aiContext);
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.tempMoveElement = (parentPort, storyboardId, nodeToMoveElementKey, newIndex) => {
        var _a, _b, _c, _d, _e;
        const elementKeyToNavNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE) || {};
        const navNodeToMove = elementKeyToNavNode[nodeToMoveElementKey];
        if (!navNodeToMove) {
            return;
        }
        const nodeToMoveElement = tempoElement_1.TempoElement.fromKey(nodeToMoveElementKey);
        const domElementsToMove = [];
        // In components, there may be multiple elements that need to be moved, the eleemntKeyToLookupList
        // are all the real DOM elements in a component
        // For non-components, the eleemntKeyToLookupList points to a list of itself
        const elementKeyToLookupList = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_LOOKUP_LIST) || {};
        const lookupList = elementKeyToLookupList[navNodeToMove.tempoElement.getKey()] || [];
        lookupList.forEach((lookupElementKey) => {
            domElementsToMove.push((0, jquery_1.default)('body').find(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${lookupElementKey}`).get(0));
        });
        const parentDomElement = (_a = domElementsToMove[0]) === null || _a === void 0 ? void 0 : _a.parentElement;
        const parentNavNode = navNodeToMove.parent;
        if (parentDomElement && parentNavNode) {
            const currentIndex = (_b = parentNavNode === null || parentNavNode === void 0 ? void 0 : parentNavNode.children) === null || _b === void 0 ? void 0 : _b.indexOf(navNodeToMove);
            const numChildren = (_c = parentNavNode === null || parentNavNode === void 0 ? void 0 : parentNavNode.children) === null || _c === void 0 ? void 0 : _c.length;
            if (currentIndex !== newIndex) {
                Array.from(parentDomElement.children).forEach((child) => {
                    (0, jquery_1.default)(child).attr(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true');
                });
                (0, jquery_1.default)(parentDomElement).attr(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true');
                if (newIndex === numChildren - 1) {
                    domElementsToMove.forEach((element) => {
                        element.parentElement.appendChild(element);
                    });
                }
                else {
                    // If the current index is before the new index then we need to adjust by 1 to account for the shift in indices
                    const beforeNode = currentIndex > newIndex
                        ? parentNavNode === null || parentNavNode === void 0 ? void 0 : parentNavNode.children[newIndex]
                        : parentNavNode === null || parentNavNode === void 0 ? void 0 : parentNavNode.children[newIndex + 1];
                    const lookupListForBefore = elementKeyToLookupList[(_d = beforeNode === null || beforeNode === void 0 ? void 0 : beforeNode.tempoElement) === null || _d === void 0 ? void 0 : _d.getKey()] || [];
                    if (!lookupListForBefore.length) {
                        console.log('Cannot find element to insert before in lookup list');
                        return;
                    }
                    const beforeDomElement = (0, jquery_1.default)('body')
                        .find(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${lookupListForBefore[0]}`)
                        .get(0);
                    if (!beforeDomElement) {
                        console.log('Cannot find element to insert before');
                        return;
                    }
                    domElementsToMove.forEach((element) => {
                        element.parentElement.insertBefore(element, beforeDomElement);
                    });
                }
                // Update the selected element key to the new expected one (note if moving there is no hovered element key)
                // This also assumes the nodeToMoveElementKey is the selected element key
                const elementToMoveSegments = nodeToMoveElement.uniquePath.split('-');
                const newSelectedUniquePath = elementToMoveSegments
                    .slice(0, elementToMoveSegments.length - 1)
                    .join('-') + `-${newIndex}`;
                const newSelectedElementKey = new tempoElement_1.TempoElement(nodeToMoveElement.codebaseId, nodeToMoveElement.storyboardId, newSelectedUniquePath).getKey();
                // Update the nav tree which also sets the element key on all the elements, need to do this before
                // updating the selected element key
                buildAndSendNavTree(parentPort, storyboardId);
                // Codebase ID doesn't change
                parentPort.postMessage({
                    id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
                    elementKey: newSelectedElementKey,
                    outerHTML: (_e = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${newSelectedElementKey}`).get(0)) === null || _e === void 0 ? void 0 : _e.outerHTML,
                });
                (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, newSelectedElementKey);
                (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
            }
        }
    };
    // @ts-ignore
    window.tempAddDiv = (parentPort, storyboardId, parentCodebaseId, indexInParent, width, height) => {
        const element = (0, jquery_1.default)(`.${identifierUtils_1.TEMPO_INSTANT_DIV_DRAW_CLASS}`);
        if (element.length) {
            element.css('width', width);
            element.css('height', height);
        }
        else {
            let parent = (0, jquery_1.default)(`.${parentCodebaseId}`);
            if (!parent.length) {
                parent = (0, jquery_1.default)('body');
            }
            parent.each((index, item) => {
                const newElement = (0, jquery_1.default)(`<div class="${identifierUtils_1.TEMPO_INSTANT_DIV_DRAW_CLASS}" ${identifierUtils_1.TEMPO_DELETE_AFTER_INSTANT_UPDATE}="true" ${identifierUtils_1.TEMPO_DELETE_AFTER_REFRESH}="true" ${identifierUtils_1.TEMPO_INSTANT_UPDATE}="true"></div>`);
                const childAtIndex = (0, jquery_1.default)(item).children().eq(indexInParent);
                if (childAtIndex === null || childAtIndex === void 0 ? void 0 : childAtIndex.length) {
                    childAtIndex.before(newElement);
                }
                else {
                    (0, jquery_1.default)(item).append(newElement);
                }
            });
            // Update the nav tree
            buildAndSendNavTree(parentPort, storyboardId);
        }
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.tempMoveToNewParent = (parentPort, storyboardId, indicatorWidth, indicatorHeight, newPositionX, newPositionY, parentElementKey, clear) => {
        (0, jquery_1.default)(`.${identifierUtils_1.TEMPO_MOVE_BETWEEN_PARENTS_OUTLINE}`).remove();
        if (clear) {
            return;
        }
        const newElement = document.createElement('div');
        newElement.classList.add(identifierUtils_1.TEMPO_MOVE_BETWEEN_PARENTS_OUTLINE);
        newElement.setAttribute(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true'); // Add so it doesn't trigger new nav tree building
        newElement.style.width = indicatorWidth + 'px';
        newElement.style.height = indicatorHeight + 'px';
        newElement.style.left = newPositionX + 'px';
        newElement.style.top = newPositionY + 'px';
        newElement.style.position = 'fixed';
        newElement.style.pointerEvents = 'none';
        newElement.style.zIndex = '2000000004';
        newElement.style.boxSizing = 'border-box';
        newElement.style.cursor = 'default !important';
        newElement.style.backgroundColor = outlineUtils_1.PRIMARY_OUTLINE_COLOUR;
        const body = document.getElementsByTagName('body')[0];
        body.appendChild(newElement);
        const parentDomElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${parentElementKey}`).get(0);
        if (parentDomElement) {
            const boundingRect = parentDomElement.getBoundingClientRect();
            const parentOutline = (0, outlineUtils_1.getOutlineElement)(parentPort, outlineUtils_1.OutlineType.PRIMARY, boundingRect.left, boundingRect.top, boundingRect.width, boundingRect.height);
            parentOutline.classList.remove(identifierUtils_1.OUTLINE_CLASS);
            parentOutline.classList.add(identifierUtils_1.TEMPO_MOVE_BETWEEN_PARENTS_OUTLINE);
            parentOutline.setAttribute(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true'); // Add so it doesn't trigger new nav tree building
            body.appendChild(parentOutline);
        }
    };
    // @ts-ignore
    window.checkIfHydrationError = (parentPort, storyboardId) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        let errorDescr, errorLabel, errorBody, hasError;
        if (window.location.href.includes('framework=VITE')) {
            // @ts-ignore
            const errorPortal = (_a = document.getElementsByTagName('vite-error-overlay')[0]) === null || _a === void 0 ? void 0 : _a.shadowRoot;
            errorDescr = 'A Vite Error Occurred';
            errorLabel =
                (_d = (_c = (_b = errorPortal === null || errorPortal === void 0 ? void 0 : errorPortal.querySelectorAll) === null || _b === void 0 ? void 0 : _b.call(errorPortal, '.file-link')) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.innerHTML;
            errorBody = (_g = (_f = (_e = errorPortal === null || errorPortal === void 0 ? void 0 : errorPortal.querySelectorAll) === null || _e === void 0 ? void 0 : _e.call(errorPortal, '.message')) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.innerHTML;
            hasError = Boolean(errorLabel || errorBody);
        }
        else {
            // @ts-ignore
            const errorPortal = (_h = document.getElementsByTagName('nextjs-portal')[0]) === null || _h === void 0 ? void 0 : _h.shadowRoot;
            errorDescr = (_k = (_j = errorPortal === null || errorPortal === void 0 ? void 0 : errorPortal.getElementById) === null || _j === void 0 ? void 0 : _j.call(errorPortal, 'nextjs__container_errors_desc')) === null || _k === void 0 ? void 0 : _k.innerHTML;
            errorLabel = (_m = (_l = errorPortal === null || errorPortal === void 0 ? void 0 : errorPortal.getElementById) === null || _l === void 0 ? void 0 : _l.call(errorPortal, 'nextjs__container_errors_label')) === null || _m === void 0 ? void 0 : _m.innerHTML;
            errorBody = (_q = (_p = (_o = errorPortal === null || errorPortal === void 0 ? void 0 : errorPortal.querySelectorAll) === null || _o === void 0 ? void 0 : _o.call(errorPortal, '.nextjs-container-errors-body')) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.innerHTML;
            hasError = Boolean(errorDescr);
        }
        // Check if the contents of the hydration container contain the text "Hydration failed"
        if (hasError) {
            if (errorDescr === null || errorDescr === void 0 ? void 0 : errorDescr.includes('Hydration failed')) {
                parentPort.postMessage({
                    id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.LATEST_HYDRATION_ERROR_STATUS,
                    status: constantsAndTypes_1.STORYBOARD_HYDRATION_STATUS.ERROR,
                    errorDescr,
                    errorLabel,
                    errorBody,
                });
            }
            else {
                parentPort.postMessage({
                    id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.LATEST_HYDRATION_ERROR_STATUS,
                    status: constantsAndTypes_1.STORYBOARD_HYDRATION_STATUS.OTHER_ERROR,
                    errorDescr,
                    errorLabel,
                    errorBody,
                });
            }
        }
        else {
            parentPort.postMessage({
                id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.LATEST_HYDRATION_ERROR_STATUS,
                status: constantsAndTypes_1.STORYBOARD_HYDRATION_STATUS.NO_ERROR,
            });
        }
    };
    // @ts-ignore
    window.triggerDragStart = (parentPort, storyboardId) => {
        const selectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
        const elementKeyToNavNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE) || {};
        // Something has to be selected to trigger a drag start
        if (!selectedElementKey) {
            return;
        }
        const draggedNavNode = elementKeyToNavNode[selectedElementKey];
        const parentDomElement = getParentDomElementForNavNode(draggedNavNode);
        const selectedElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectedElementKey}`).get(0);
        const mouseDragContext = {
            // Start off screen, this will get updated by onMouseMove
            pageX: -10000,
            pageY: -10000,
            // The difference between where the user clicked and the center of the element
            offsetX: 0,
            offsetY: 0,
            dragging: true,
            selectedParentDisplay: (0, cssFunctions_1.cssEval)(parentDomElement, 'display'),
            selectedParentFlexDirection: (0, cssFunctions_1.cssEval)(parentDomElement, 'flex-direction'),
        };
        (0, sessionStorageUtils_1.setMemoryStorageItem)('mouseDragContext', mouseDragContext);
        // Trigger the drag start event
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.DRAG_START_EVENT,
            event: mouseDragContext,
            outerHTML: selectedElement === null || selectedElement === void 0 ? void 0 : selectedElement.outerHTML,
        });
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.triggerDragCancel = (parentPort, storyboardId) => {
        (0, sessionStorageUtils_1.setMemoryStorageItem)('mouseDragContext', null);
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.DRAG_CANCEL_EVENT,
            event: {},
        });
        (0, outlineUtils_1.updateOutlines)(parentPort, storyboardId);
    };
    // @ts-ignore
    window.setIsFlushing = (parentPort, storyboardId, isFlushing) => {
        const wasFlushing = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.IS_FLUSHING);
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.IS_FLUSHING, isFlushing);
        if (isFlushing && !wasFlushing) {
            onFlushStart();
        }
    };
};
exports.initChannelMessagingFunctions = initChannelMessagingFunctions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbm5lbE1lc3NhZ2luZ0Z1bmN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jaGFubmVsTWVzc2FnaW5nL2NoYW5uZWxNZXNzYWdpbmdGdW5jdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBa0IyQjtBQUMzQiwrREFxQitCO0FBQy9CLGlEQUt3QjtBQUV4QixhQUFhO0FBQ2Isb0RBQXVCO0FBQ3ZCLG9EQUF1QjtBQUN2QixpREFPd0I7QUFDeEIsaURBT3dCO0FBQ3hCLDJEQUk2QjtBQUM3QiwrREFLK0I7QUFDL0IsMkNBS3FCO0FBQ3JCLGlEQUE4QztBQUs5QyxtREFNeUI7QUFFekIsTUFBTSwwQkFBMEIsR0FBRyxFQUFFLENBQUM7QUFFdEMsTUFBTSwrQkFBK0IsR0FBRyxpQ0FBaUMsQ0FBQztBQUUxRSxNQUFNLDBCQUEwQixHQUFHLDRCQUE0QixDQUFDO0FBRWhFLHlEQUF5RDtBQUVsRCxNQUFNLDZCQUE2QixHQUFHLEdBQUcsRUFBRTtJQUNoRCxhQUFhO0lBQ2IsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUc7UUFDMUIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUNWLENBQUMsRUFDRCxHQUFHLENBQUM7UUFDTixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBQ25DLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNoQyxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QixJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztZQUNoQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsMkJBQTJCO1NBQ3ZDO1FBQ0QsT0FBTyxJQUFJLENBQUM7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QUNSLENBQUM7UUFDRixVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsZ0JBQWdCLENBQzFCLGFBQWEsRUFDYixDQUFDLENBQU0sRUFBRSxFQUFFO1lBQ1QseUJBQXlCLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN6RCxDQUFDLEVBQ0QsT0FBTyxDQUNSLENBQUM7UUFDRixVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsZ0JBQWdCLENBQzFCLFVBQVUsRUFDVixDQUFDLENBQU0sRUFBRSxFQUFFO1lBQ1QseUJBQXlCLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN6RCxDQUFDLEVBQ0QsT0FBTyxDQUNSLENBQUM7UUFFRixVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsZ0JBQWdCLENBQzFCLFdBQVcsRUFDWCxDQUFDLENBQU0sRUFBRSxFQUFFO1lBQ1QseUJBQXlCLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN6RCxDQUFDLEVBQ0QsT0FBTyxDQUNSLENBQUM7UUFDRixVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsZ0JBQWdCLENBQzFCLFVBQVUsRUFDVixDQUFDLENBQU0sRUFBRSxFQUFFO1lBQ1QseUJBQXlCLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN6RCxDQUFDLEVBQ0QsT0FBTyxDQUNSLENBQUM7UUFDRixVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsZ0JBQWdCLENBQzFCLFdBQVcsRUFDWCxDQUFDLENBQU0sRUFBRSxFQUFFO1lBQ1QseUJBQXlCLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN6RCxDQUFDLEVBQ0QsT0FBTyxDQUNSLENBQUM7UUFDRixVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsZ0JBQWdCLENBQzFCLFdBQVcsRUFDWCxDQUFDLENBQU0sRUFBRSxFQUFFO1lB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SUFBSSxVQUFVLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDOUIsWUFBWSxFQUFFLENBQUM7U0FDaEI7SUFDSCxDQUFDLENBQUM7QUFDSixDQUFDLENBQUM7QUF2ckVXLFFBQUEsNkJBQTZCLGlDQXVyRXhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgZ2V0VW5pcXVlTG9va3VwRnJvbU5vZGUsXG4gIGlzTW92aW5nRWxlbWVudCxcbiAgVEVNUE9fREVMRVRFX0FGVEVSX1JFRlJFU0gsXG4gIFRFTVBPX0lOU1RBTlRfVVBEQVRFLFxuICBURU1QT19JTlNUQU5UX0RJVl9EUkFXX0NMQVNTLFxuICBURU1QT19NT1ZFX0JFVFdFRU5fUEFSRU5UU19PVVRMSU5FLFxuICBPVVRMSU5FX0NMQVNTLFxuICBURU1QT19ESVNQTEFZX05PTkVfVU5USUxfUkVGUkVTSF9DTEFTUyxcbiAgZ2V0RWxlbWVudEtleUZyb21Ob2RlLFxuICBFTEVNRU5UX0tFWV9QUkVGSVgsXG4gIFRFTVBPX0RPX05PVF9TSE9XX0lOX05BVl9VTlRJTF9SRUZSRVNILFxuICBURU1QT19JTlNUQU5UX1VQREFURV9TVFlMSU5HX1BSRUZJWCxcbiAgRURJVF9URVhUX0JVVFRPTixcbiAgaGFzQ2xhc3MsXG4gIFRFTVBPX1FVRVVFX0RFTEVURV9BRlRFUl9IT1RfUkVMT0FELFxuICBURU1QT19ERUxFVEVfQUZURVJfSU5TVEFOVF9VUERBVEUsXG4gIGlzRWxlbWVudEluU3ZnLFxufSBmcm9tICcuL2lkZW50aWZpZXJVdGlscyc7XG5pbXBvcnQge1xuICBDVVJSRU5UX05BVl9UUkVFLFxuICBIT1ZFUkVEX0VMRU1FTlRfS0VZLFxuICBTQVZFRF9TVE9SWUJPQVJEX0NPTVBPTkVOVF9GSUxFTkFNRSxcbiAgU0NPUEVfTE9PS1VQLFxuICBTRUxFQ1RFRF9FTEVNRU5UX0tFWSxcbiAgU1RPUllCT0FSRF9DT01QT05FTlQsXG4gIFNUT1JZQk9BUkRfVFlQRSxcbiAgVFJFRV9FTEVNRU5UX0xPT0tVUCxcbiAgRUxFTUVOVF9LRVlfVE9fTE9PS1VQX0xJU1QsXG4gIEVMRU1FTlRfS0VZX1RPX05BVl9OT0RFLFxuICBnZXRNZW1vcnlTdG9yYWdlSXRlbSxcbiAgZ2V0U2Vzc2lvblN0b3JhZ2VJdGVtLFxuICByZW1vdmVNZW1vcnlTdG9yYWdlSXRlbSxcbiAgcmVtb3ZlU2Vzc2lvblN0b3JhZ2VJdGVtLFxuICBzZXRNZW1vcnlTdG9yYWdlSXRlbSxcbiAgc2V0U2Vzc2lvblN0b3JhZ2VJdGVtLFxuICBNVUxUSV9TRUxFQ1RFRF9FTEVNRU5UX0tFWVMsXG4gIEhPVF9SRUxPQURJTkcsXG4gIElTX0ZMVVNISU5HLFxuICBPUklHSU5BTF9TVE9SWUJPQVJEX1VSTCxcbn0gZnJvbSAnLi9zZXNzaW9uU3RvcmFnZVV0aWxzJztcbmltcG9ydCB7XG4gIE5hdlRyZWVOb2RlLFxuICBTS0lQX1JPT1RfQ09ERUJBU0VfSUQsXG4gIGJ1aWxkTmF2Rm9yTm9kZSxcbiAgcnVuTmF2VHJlZUJ1aWx0Q2FsbGJhY2tzLFxufSBmcm9tICcuL25hdlRyZWVVdGlscyc7XG5cbi8vIEB0cy1pZ25vcmVcbmltcG9ydCAkIGZyb20gJ2pxdWVyeSc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHtcbiAgT3V0bGluZVR5cGUsXG4gIFBSSU1BUllfT1VUTElORV9DT0xPVVIsXG4gIGNsZWFyQWxsT3V0bGluZXMsXG4gIGdldE91dGxpbmVFbGVtZW50LFxuICBpc05vZGVPdXRsaW5lLFxuICB1cGRhdGVPdXRsaW5lcyxcbn0gZnJvbSAnLi9vdXRsaW5lVXRpbHMnO1xuaW1wb3J0IHtcbiAgY3NzRXZhbCxcbiAgZ2V0Q3NzRXZhbHMsXG4gIGdldEVsZW1lbnRDbGFzc0xpc3QsXG4gIHByb2Nlc3NSdWxlc0ZvclNlbGVjdGVkRWxlbWVudCxcbiAgcnVsZU1hdGNoZXNFbGVtZW50LFxuICBzZXRNb2RpZmllcnNGb3JTZWxlY3RlZEVsZW1lbnQsXG59IGZyb20gJy4vY3NzRnVuY3Rpb25zJztcbmltcG9ydCB7XG4gIEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUyxcbiAgU0VMRUNUX09SX0hPVkVSX1NUT1JZQk9BUkQsXG4gIFNUT1JZQk9BUkRfSFlEUkFUSU9OX1NUQVRVUyxcbn0gZnJvbSAnLi9jb25zdGFudHNBbmRUeXBlcyc7XG5pbXBvcnQge1xuICBBRERfQ0xBU1NfSU5TVEFOVF9VUERBVEVfUVVFVUUsXG4gIFRFTVBPUkFSWV9TVFlMSU5HX0NMQVNTX05BTUUsXG4gIGFwcGx5Q2hhbmdlSXRlbVRvRG9jdW1lbnQsXG4gIHVwZGF0ZUNvZGViYXNlSWRzLFxufSBmcm9tICcuL2NoYW5nZUl0ZW1GdW5jdGlvbnMnO1xuaW1wb3J0IHtcbiAgYnVpbGROb2RlVHJlZSxcbiAgYnVpbGRUcmVlTG9va3VwTWFwLFxuICBjbGVhckxvb2t1cHNGcm9tVHJlZSxcbiAgZ2V0Um9vdFJlYWN0RWxlbWVudCxcbn0gZnJvbSAnLi9yZXNxVXRpbHMnO1xuaW1wb3J0IHsgVGVtcG9FbGVtZW50IH0gZnJvbSAnLi90ZW1wb0VsZW1lbnQnO1xuaW1wb3J0IHtcbiAgQW55Q2hhbmdlTGVkZ2VySXRlbSxcbiAgcmVjb25zdHJ1Y3RDaGFuZ2VMZWRnZXJDbGFzcyxcbn0gZnJvbSAnLi9jaGFuZ2VMZWRnZXJUeXBlcyc7XG5pbXBvcnQge1xuICBjYW5FZGl0VGV4dCxcbiAgY3VycmVudGx5RWRpdGluZyxcbiAgZ2V0RWRpdGluZ0luZm8sXG4gIHNldHVwRWRpdGFibGVUZXh0LFxuICB0ZWFyZG93bkVkaXRhYmxlVGV4dCxcbn0gZnJvbSAnLi9lZGl0VGV4dFV0aWxzJztcblxuY29uc3QgUElYRUxTX1RPX01PVkVfQkVGT1JFX0RSQUcgPSAyMDtcblxuY29uc3QgSU1NRURJQVRFTFlfUkVNT1ZFX1BPSU5URVJfTE9DSyA9ICdJTU1FRElBVEVMWV9SRU1PVkVfUE9JTlRFUl9MT0NLJztcblxuY29uc3QgTEFTVF9OQVZfVFJFRV9SRUZSRVNIX1RJTUUgPSAnTEFTVF9OQVZfVFJFRV9SRUZSRVNIX1RJTUUnO1xuXG4vLyBUT0RPOiBDaGFuZ2UgYWxsIG9mIHRoaXMgdG8gYmUgYSByZWFjdCB3cmFwcGVyIGxpYnJhcnlcblxuZXhwb3J0IGNvbnN0IGluaXRDaGFubmVsTWVzc2FnaW5nRnVuY3Rpb25zID0gKCkgPT4ge1xuICAvLyBAdHMtaWdub3JlXG4gIFN0cmluZy5wcm90b3R5cGUuaGFzaENvZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGhhc2ggPSAwLFxuICAgICAgaSxcbiAgICAgIGNocjtcbiAgICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVybiBoYXNoO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaHIgPSB0aGlzLmNoYXJDb2RlQXQoaSk7XG4gICAgICBoYXNoID0gKGhhc2ggPDwgNSkgLSBoYXNoICsgY2hyO1xuICAgICAgaGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcbiAgICB9XG4gICAgcmV0dXJuIGhhc2g7XG4gIH07XG5cbiAgLy8gV2Ugd2FudCB0byBtYWtlIGV2ZW50IGxpc3RlbmVycyBub24tcGFzc2l2ZSwgYW5kIHRvIGRvIHNvIGhhdmUgdG8gY2hlY2tcbiAgLy8gdGhhdCBicm93c2VycyBzdXBwb3J0IEV2ZW50TGlzdGVuZXJPcHRpb25zIGluIHRoZSBmaXJzdCBwbGFjZS5cbiAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50VGFyZ2V0L2FkZEV2ZW50TGlzdGVuZXIjU2FmZWx5X2RldGVjdGluZ19vcHRpb25fc3VwcG9ydFxuICBsZXQgcGFzc2l2ZVN1cHBvcnRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0IG1ha2VQYXNzaXZlRXZlbnRPcHRpb24gPSAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGdldCBwYXNzaXZlKCkge1xuICAgICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgYnJvd3NlclxuICAgICAgICAgIC8vICAgYXR0ZW1wdHMgdG8gYWNjZXNzIHRoZSBwYXNzaXZlIHByb3BlcnR5LlxuICAgICAgICAgIHBhc3NpdmVTdXBwb3J0ZWQgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcGFzc2l2ZVN1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHBhc3NpdmVTdXBwb3J0ZWQ7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBUYWtlbiBmcm9tOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zMjE5NzU4L2RldGVjdC1jaGFuZ2VzLWluLXRoZS1kb21cbiAgICpcbiAgICogUmV0dXJucyB0aGUgZnVuY3Rpb24gdG8gZGlzY29ubmVjdCB0aGUgb2JzZXJ2ZXJcbiAgICovXG4gIGNvbnN0IG9ic2VydmVET00gPSAoZnVuY3Rpb24gKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB2YXIgTXV0YXRpb25PYnNlcnZlciA9XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB3aW5kb3cuTXV0YXRpb25PYnNlcnZlciB8fCB3aW5kb3cuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcblxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqOiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAgIGlmICghb2JqIHx8IG9iai5ub2RlVHlwZSAhPT0gMSkgcmV0dXJuICgpID0+IHt9O1xuXG4gICAgICBpZiAoTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICAvLyBkZWZpbmUgYSBuZXcgb2JzZXJ2ZXJcbiAgICAgICAgdmFyIG11dGF0aW9uT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XG5cbiAgICAgICAgLy8gaGF2ZSB0aGUgb2JzZXJ2ZXIgb2JzZXJ2ZSBmb28gZm9yIGNoYW5nZXMgaW4gY2hpbGRyZW5cbiAgICAgICAgbXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKG9iaiwge1xuICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIG11dGF0aW9uT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBicm93c2VyIHN1cHBvcnQgZmFsbGJhY2tcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGVsc2UgaWYgKHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKCdET01Ob2RlSW5zZXJ0ZWQnLCBjYWxsYmFjaywgZmFsc2UpO1xuICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcignRE9NTm9kZVJlbW92ZWQnLCBjYWxsYmFjaywgZmFsc2UpO1xuXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTU5vZGVJbnNlcnRlZCcsIGNhbGxiYWNrLCBmYWxzZSk7XG4gICAgICAgICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTU5vZGVSZW1vdmVkJywgY2FsbGJhY2ssIGZhbHNlKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICgpID0+IHt9O1xuICAgIH07XG4gIH0pKCk7XG5cbiAgLyoqXG4gICAqIFdoZW4gc2VsZWN0aW5nIGluIG5vcm1hbCBtb2RlIChub3QgbWV0YSBrZXkpLCBjYW4gc2VsZWN0IG9uZSBsZXZlbCBkb3duLCBhIHNpYmxpbmdcbiAgICogb3IgYSBwYXJlbnQgb2YgdGhlIHNlbGVjdGVkIGVsZW1lbnRcbiAgICovXG4gIGNvbnN0IGdldFNlbGVjdGFibGVOYXZOb2RlID0gKGU6IGFueSk6IE5hdlRyZWVOb2RlIHwgbnVsbCB8IHN0cmluZyA9PiB7XG4gICAgY29uc3Qgc2VsZWN0ZWRFbGVtZW50S2V5OiBzdHJpbmcgPVxuICAgICAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVkpO1xuICAgIGNvbnN0IHNlbGVjdGVkRWxlbWVudCA9IFRlbXBvRWxlbWVudC5mcm9tS2V5KHNlbGVjdGVkRWxlbWVudEtleSk7XG5cbiAgICBjb25zdCBlbGVtZW50S2V5VG9OYXZOb2RlID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oRUxFTUVOVF9LRVlfVE9fTkFWX05PREUpO1xuXG4gICAgLy8gTW92ZSB1cCB0aGUgdHJlZSB1bnRpbCB5b3UgZmluZCB0aGUgZmlyc3QgdmFsaWQgbmF2IG5vZGVcbiAgICBsZXQgZmlyc3ROYXZOb2RlOiBOYXZUcmVlTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBzZWFyY2hOb2RlID0gZS50YXJnZXQ7XG4gICAgd2hpbGUgKHNlYXJjaE5vZGUgJiYgIWZpcnN0TmF2Tm9kZSkge1xuICAgICAgZmlyc3ROYXZOb2RlID1cbiAgICAgICAgZWxlbWVudEtleVRvTmF2Tm9kZVtnZXRFbGVtZW50S2V5RnJvbU5vZGUoc2VhcmNoTm9kZSkgfHwgJyddO1xuICAgICAgc2VhcmNoTm9kZSA9IHNlYXJjaE5vZGUucGFyZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAoIWZpcnN0TmF2Tm9kZSkge1xuICAgICAgcmV0dXJuIFNFTEVDVF9PUl9IT1ZFUl9TVE9SWUJPQVJEO1xuICAgIH1cblxuICAgIGNvbnN0IGlzTmF2Tm9kZU1hdGNoID0gKG5hdlRyZWVOb2RlOiBOYXZUcmVlTm9kZSk6IGJvb2xlYW4gPT4ge1xuICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudC5pc0VtcHR5KCkpIHtcbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBjYW5ub3QgYmUgY2FsbGVkIGlmIHRoZXJlIGlzIG5vIHNlbGVjdGVkIGVsZW1lbnQsIHNlZSBjb2RlIGxvZ2ljIGJlbG93IHRoZSBmdW5jdGlvblxuICAgICAgICB0aHJvdyBFcnJvcignTm8gc2VsZWN0ZWQgZWxlbWVudCB3aGVuIGlzTmF2Tm9kZU1hdGNoIGNhbGxlZCcpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW5hdlRyZWVOb2RlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gY29kZWJhc2UgSUQgaXQgc2hvdWxkIG5vdCBiZSBzZWxlY3RhYmxlIGFzIHRoZXJlIGlzIG5vdGhpbmcgd2UgY2FuIGRvIHdpdGggaXRcbiAgICAgIGlmIChcbiAgICAgICAgIW5hdlRyZWVOb2RlLnRlbXBvRWxlbWVudC5jb2RlYmFzZUlkLnN0YXJ0c1dpdGgoJ3RlbXBvLScpIHx8XG4gICAgICAgIG5hdlRyZWVOb2RlLnRlbXBvRWxlbWVudC5jb2RlYmFzZUlkID09PSBTS0lQX1JPT1RfQ09ERUJBU0VfSURcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0IG1hdGNoZXMsIHdlIGFscmVhZHkgcGFzc2VkIGFsbCBwb3NzaWJsZSBjaGlsZHJlbiwgc28gcmUtc2VsZWN0IGl0XG4gICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzRXF1YWwobmF2VHJlZU5vZGUudGVtcG9FbGVtZW50KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQW55IHBhcmVudCBpcyBvayB0byBzZWxlY3RcbiAgICAgIGlmIChuYXZUcmVlTm9kZS50ZW1wb0VsZW1lbnQuaXNQYXJlbnRPZihzZWxlY3RlZEVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBwYXJlbnRzXG4gICAgICAvLyBQaWNrIHRoZSBmaXJzdCBwYXJlbnQgd2l0aCBhIGNvZGViYXNlIElEXG4gICAgICBsZXQgcGFyZW50ID0gbmF2VHJlZU5vZGUucGFyZW50O1xuICAgICAgd2hpbGUgKHBhcmVudCAmJiAhcGFyZW50LnRlbXBvRWxlbWVudC5jb2RlYmFzZUlkLnN0YXJ0c1dpdGgoJ3RlbXBvLScpKSB7XG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICB9XG5cbiAgICAgIC8vIE9uZSBsZXZlbCBkb3duXG4gICAgICBpZiAocGFyZW50Py50ZW1wb0VsZW1lbnQ/LmlzRXF1YWwoc2VsZWN0ZWRFbGVtZW50KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2libGluZyBvZiBhbnkgcGFyZW50XG4gICAgICBjb25zdCBzZWxlY3RlZE5vZGUgPSBlbGVtZW50S2V5VG9OYXZOb2RlW3NlbGVjdGVkRWxlbWVudC5nZXRLZXkoKV07XG4gICAgICBpZiAoXG4gICAgICAgIHNlbGVjdGVkTm9kZSAmJlxuICAgICAgICBuYXZUcmVlTm9kZS5wYXJlbnQ/LmNoaWxkcmVuPy5pbmNsdWRlcz8uKHNlbGVjdGVkTm9kZSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBsZXQgZm91bmROYXZOb2RlOiBOYXZUcmVlTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBzZWFyY2hOYXZOb2RlOiBOYXZUcmVlTm9kZSB8IHVuZGVmaW5lZCA9IGZpcnN0TmF2Tm9kZTtcblxuICAgIHdoaWxlIChzZWFyY2hOYXZOb2RlKSB7XG4gICAgICBpZiAoIXNlbGVjdGVkRWxlbWVudC5pc0VtcHR5KCkgJiYgIXNlbGVjdGVkRWxlbWVudC5pc1N0b3J5Ym9hcmQoKSkge1xuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIHNlbGVjdGVkIGVsZW1lbnQga2V5IGxvb3AgZnJvbSB0aGlzIGVsZW1lbnQgdXAgdGhlIHN0YWNrIHRvIGZpbmQgdGhlIGVsZW1lbnQgdGhhdCBpcyB0aGUgZGlyZWN0IGNoaWxkXG4gICAgICAgIC8vIG9mIHRoZSBleHBlY3RlZCBzZWxlY3RlZCBlbGVtZW50LCBzbyB0aGF0IHlvdSBjYW4gb25seSBob3ZlciBvbmUgbGV2ZWwgZGVlcGVyIHRoYW4geW91J3ZlIHNlbGVjdGVkXG4gICAgICAgIGlmIChpc05hdk5vZGVNYXRjaChzZWFyY2hOYXZOb2RlKSkge1xuICAgICAgICAgIGZvdW5kTmF2Tm9kZSA9IHNlYXJjaE5hdk5vZGU7XG4gICAgICAgICAgLy8gRXhpdCB0aGUgbG9vcCBhcyB3ZSBmb3VuZCB0aGUgbm9kZSB0aGF0IG1hdGNoZXNcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gc2VsZWN0ZWQgZWxlbWVudCBrZXksIG9yIHRoZSBzZWxlY3Rpb24gaXMgdGhlIHN0b3J5Ym9hcmQgaXRzZWxmLCBsb29wIHVwIHRvIHRoZSB0b3AtbW9zdCBlbGVtZW50IHdpdGggYSBjb2RlYmFzZSBJRFxuICAgICAgICBpZiAoXG4gICAgICAgICAgc2VhcmNoTmF2Tm9kZS50ZW1wb0VsZW1lbnQuY29kZWJhc2VJZCAmJlxuICAgICAgICAgIHNlYXJjaE5hdk5vZGUudGVtcG9FbGVtZW50LmNvZGViYXNlSWQuc3RhcnRzV2l0aCgndGVtcG8tJylcbiAgICAgICAgKSB7XG4gICAgICAgICAgZm91bmROYXZOb2RlID0gc2VhcmNoTmF2Tm9kZTtcbiAgICAgICAgICAvLyBOb3RlOiB3ZSBkbyBub3QgZXhpdCB0aGUgbG9vcCBoZXJlIGFzIHdlIHdhbnQgdG8ga2VlcCBzZWFyY2hpbmcgZm9yIHRoZSB0b3AtbW9zdCBlbGVtZW50XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VhcmNoTmF2Tm9kZSA9IHNlYXJjaE5hdk5vZGUucGFyZW50O1xuICAgIH1cblxuICAgIHJldHVybiBmb3VuZE5hdk5vZGUgfHwgbnVsbDtcbiAgfTtcblxuICBjb25zdCBvblBvaW50ZXJPdmVyID0gKFxuICAgIGU6IGFueSxcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgc2VsZWN0Qm90dG9tTW9zdEVsZW1lbnQ/OiBib29sZWFuLFxuICApID0+IHtcbiAgICBjb25zdCBwYXNzZWRUaHJvdWdoID0gcGFzc1Rocm91Z2hFdmVudHNJZk5lZWRlZChcbiAgICAgIGUsXG4gICAgICBwYXJlbnRQb3J0LFxuICAgICAgc3Rvcnlib2FyZElkLFxuICAgICk7XG4gICAgY29uc3QgZWRpdGluZ1RleHRJbmZvID0gZ2V0RWRpdGluZ0luZm8oKTtcblxuICAgIC8vIEFsbG93IG9uIHBvaW50ZXIgb3ZlciBldmVudHMgaWYgZWRpdGluZyAoc28gd2UgY2FuIGNsaWNrIG91dClcbiAgICBpZiAoZS5hbHRLZXkgfHwgKHBhc3NlZFRocm91Z2ggJiYgIWVkaXRpbmdUZXh0SW5mbykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oJ21vdXNlRHJhZ0NvbnRleHQnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRIb3ZlcmVkS2V5ID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oSE9WRVJFRF9FTEVNRU5UX0tFWSk7XG5cbiAgICBjb25zdCBlbGVtZW50S2V5VG9OYXZOb2RlID1cbiAgICAgIGdldE1lbW9yeVN0b3JhZ2VJdGVtKEVMRU1FTlRfS0VZX1RPX05BVl9OT0RFKSB8fCB7fTtcblxuICAgIGxldCBob3ZlcmVkTmF2Tm9kZTogTmF2VHJlZU5vZGUgfCBudWxsIHwgc3RyaW5nO1xuICAgIGlmIChlLm1ldGFLZXkgfHwgZS5jdHJsS2V5IHx8IHNlbGVjdEJvdHRvbU1vc3RFbGVtZW50KSB7XG4gICAgICBjb25zdCBlbGVtZW50S2V5OiBhbnkgPSBnZXRFbGVtZW50S2V5RnJvbU5vZGUoZS50YXJnZXQpO1xuICAgICAgaG92ZXJlZE5hdk5vZGUgPSBlbGVtZW50S2V5VG9OYXZOb2RlW2VsZW1lbnRLZXldO1xuXG4gICAgICAvLyBTcGVjaWFsIGNhc2UgLT4gdGhpcyBpcyB0aGUgdG9wLW1vc3Qgbm9kZSBzbyBpdCBzaG91bGQgdHJpZ2dlciBhIGhvdmVyIG9uIHRoZSBzdG9yeWJvYXJkXG4gICAgICBpZiAoIWhvdmVyZWROYXZOb2RlICYmIGUudGFyZ2V0LnBhcmVudE5vZGUgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgaG92ZXJlZE5hdk5vZGUgPSBTRUxFQ1RfT1JfSE9WRVJfU1RPUllCT0FSRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaG92ZXJlZE5hdk5vZGUgPSBnZXRTZWxlY3RhYmxlTmF2Tm9kZShlKTtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50U2VsZWN0ZWRLZXkgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShTRUxFQ1RFRF9FTEVNRU5UX0tFWSk7XG4gICAgY29uc3QgY3VycmVudFNlbGVjdGVkRWxlbWVudCA9IFRlbXBvRWxlbWVudC5mcm9tS2V5KGN1cnJlbnRTZWxlY3RlZEtleSk7XG5cbiAgICAvLyBJZiB0aGUgdXNlciBpcyBob2xkaW5nIHNoaWZ0LCBvbmx5IGFsbG93IHNlbGVjdGluZyBzaWJsaW5nc1xuICAgIGlmIChlLnNoaWZ0S2V5ICYmIGhvdmVyZWROYXZOb2RlICYmIGN1cnJlbnRTZWxlY3RlZEtleSkge1xuICAgICAgLy8gVHJ5aW5nIHRvIHNlbGVjdCB0aGUgZW50aXJlIHN0b3J5Ym9hcmQsIGFsbG93IG9ubHkgaWYgdGhlIG90aGVyIHNlbGVjdGVkIGVsZW1lbnQgaXMgYWxzbyBhIHN0b3J5Ym9hcmRcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGhvdmVyZWROYXZOb2RlID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAhY3VycmVudFNlbGVjdGVkRWxlbWVudC5pc1N0b3J5Ym9hcmQoKVxuICAgICAgKSB7XG4gICAgICAgIGhvdmVyZWROYXZOb2RlID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgaG92ZXJlZE5hdk5vZGUgIT09ICdzdHJpbmcnICYmXG4gICAgICAgICFob3ZlcmVkTmF2Tm9kZT8udGVtcG9FbGVtZW50LmlzU2libGluZ09mKGN1cnJlbnRTZWxlY3RlZEVsZW1lbnQpXG4gICAgICApIHtcbiAgICAgICAgaG92ZXJlZE5hdk5vZGUgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghaG92ZXJlZE5hdk5vZGUpIHtcbiAgICAgIGlmIChjdXJyZW50SG92ZXJlZEtleSAhPT0gbnVsbCkge1xuICAgICAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShIT1ZFUkVEX0VMRU1FTlRfS0VZLCBudWxsKTtcbiAgICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5IT1ZFUkVEX0VMRU1FTlRfS0VZLFxuICAgICAgICAgIGVsZW1lbnRLZXk6IG51bGwsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGhvdmVyZWROYXZOb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKGhvdmVyZWROYXZOb2RlID09PSBTRUxFQ1RfT1JfSE9WRVJfU1RPUllCT0FSRCkge1xuICAgICAgICBjb25zdCBzdG9yeWJvYXJkS2V5ID0gVGVtcG9FbGVtZW50LmZvclN0b3J5Ym9hcmQoc3Rvcnlib2FyZElkKS5nZXRLZXkoKTtcblxuICAgICAgICBpZiAoY3VycmVudEhvdmVyZWRLZXkgIT09IHN0b3J5Ym9hcmRLZXkpIHtcbiAgICAgICAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShIT1ZFUkVEX0VMRU1FTlRfS0VZLCBzdG9yeWJvYXJkS2V5KTtcblxuICAgICAgICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5IT1ZFUkVEX0VMRU1FTlRfS0VZLFxuICAgICAgICAgICAgZWxlbWVudEtleTogc3Rvcnlib2FyZEtleSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRlbXBvRWxlbWVudEtleSA9IGhvdmVyZWROYXZOb2RlLnRlbXBvRWxlbWVudC5nZXRLZXkoKTtcblxuICAgIGlmIChjdXJyZW50SG92ZXJlZEtleSAhPT0gdGVtcG9FbGVtZW50S2V5KSB7XG4gICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5IT1ZFUkVEX0VMRU1FTlRfS0VZLFxuICAgICAgICBlbGVtZW50S2V5OiB0ZW1wb0VsZW1lbnRLZXksXG4gICAgICB9KTtcbiAgICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKEhPVkVSRURfRUxFTUVOVF9LRVksIHRlbXBvRWxlbWVudEtleSk7XG4gICAgICB1cGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBjbGVhckhvdmVyZWRFbGVtZW50cyA9IChwYXJlbnRQb3J0OiBhbnksIHN0b3J5Ym9hcmRJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY3VycmVudEhvdmVyZWRLZXkgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShIT1ZFUkVEX0VMRU1FTlRfS0VZKTtcblxuICAgIGlmICghY3VycmVudEhvdmVyZWRLZXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuSE9WRVJFRF9FTEVNRU5UX0tFWSxcbiAgICAgIGVsZW1lbnRLZXk6IG51bGwsXG4gICAgfSk7XG4gICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oSE9WRVJFRF9FTEVNRU5UX0tFWSwgbnVsbCk7XG5cbiAgICB1cGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICB9O1xuXG4gIGNvbnN0IG9uUG9pbnRlck1vdmUgPSBhc3luYyAoXG4gICAgZTogYW55LFxuICAgIHBhcmVudFBvcnQ6IGFueSxcbiAgICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbiAgKSA9PiB7XG4gICAgcGFzc1Rocm91Z2hFdmVudHNJZk5lZWRlZChlLCBwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuXG4gICAgLy8gSWYgbm8gYnV0dG9ucyBhcmUgcHJlc3NlZCB0aGUgZHJhZyBlbmQgZXZlbnQgbWF5IG5vdCBoYXZlIGNvcnJlY3RseSB0cmlnZ2VyZWRcbiAgICAvLyByZXNldCB0aGUgZHJhZyBzdGF0ZVxuICAgIGxldCBtb3VzZURyYWdEYXRhID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oJ21vdXNlRHJhZ0NvbnRleHQnKTtcbiAgICBpZiAoIWUuYnV0dG9ucyAmJiBtb3VzZURyYWdEYXRhKSB7XG4gICAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbSgnbW91c2VEcmFnQ29udGV4dCcsIG51bGwpO1xuXG4gICAgICBpZiAobW91c2VEcmFnRGF0YT8uZHJhZ2dpbmcpIHtcbiAgICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5EUkFHX0NBTkNFTF9FVkVOVCxcbiAgICAgICAgICBldmVudDoge30sXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBtb3VzZURyYWdEYXRhID0gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBpbXBvcnRhbnRGaWVsZHMgPSB7XG4gICAgICBwYWdlWDogZS5wYWdlWCxcbiAgICAgIHBhZ2VZOiBlLnBhZ2VZLFxuXG4gICAgICBjbGllbnRYOiBlLmNsaWVudFgsXG4gICAgICBjbGllbnRZOiBlLmNsaWVudFksXG4gICAgfTtcblxuICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKCdtb3VzZVBvcycsIGltcG9ydGFudEZpZWxkcyk7XG5cbiAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuTU9VU0VfTU9WRV9FVkVOVCxcbiAgICAgIGV2ZW50OiBpbXBvcnRhbnRGaWVsZHMsXG4gICAgfSk7XG5cbiAgICBpZiAobW91c2VEcmFnRGF0YSAmJiAhbW91c2VEcmFnRGF0YS5kcmFnZ2luZykge1xuICAgICAgY29uc3Qgem9vbVBlcmMgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbSgnem9vbVBlcmMnKSB8fCAxO1xuXG4gICAgICBjb25zdCB0b3RhbE1vdmVtZW50UGl4ZWxzID1cbiAgICAgICAgTWF0aC5hYnMobW91c2VEcmFnRGF0YS5wYWdlWCAtIGUucGFnZVgpICtcbiAgICAgICAgTWF0aC5hYnMobW91c2VEcmFnRGF0YS5wYWdlWSAtIGUucGFnZVkpO1xuICAgICAgLy8gU3RhcnQgdGhlIGRyYWcgZXZlbnQgaWYgdGhlIHVzZXIgaGFzIG1vdmVkIGVub3VnaFxuICAgICAgaWYgKHRvdGFsTW92ZW1lbnRQaXhlbHMgPj0gUElYRUxTX1RPX01PVkVfQkVGT1JFX0RSQUcgLyB6b29tUGVyYykge1xuICAgICAgICAvLyBSZXNlbGVjdCB0aGUgcGFyZW50IGlmIHRoZXJlIHdhcyBvbmUgdG8gc2VsZWN0XG4gICAgICAgIGlmIChtb3VzZURyYWdEYXRhLnBhcmVudFNlbGVjdGVkRWxlbWVudEtleSkge1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnRLZXlUb05hdk5vZGUgPVxuICAgICAgICAgICAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oRUxFTUVOVF9LRVlfVE9fTkFWX05PREUpIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IG5hdk5vZGVUb1NlbGVjdCA9XG4gICAgICAgICAgICBlbGVtZW50S2V5VG9OYXZOb2RlW21vdXNlRHJhZ0RhdGEucGFyZW50U2VsZWN0ZWRFbGVtZW50S2V5XTtcblxuICAgICAgICAgIGlmIChuYXZOb2RlVG9TZWxlY3QpIHtcbiAgICAgICAgICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLlNFTEVDVEVEX0VMRU1FTlRfS0VZLFxuICAgICAgICAgICAgICBlbGVtZW50S2V5OiBtb3VzZURyYWdEYXRhLnBhcmVudFNlbGVjdGVkRWxlbWVudEtleSxcbiAgICAgICAgICAgICAgb3V0ZXJIVE1MOiAkKFxuICAgICAgICAgICAgICAgIGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHttb3VzZURyYWdEYXRhLnBhcmVudFNlbGVjdGVkRWxlbWVudEtleX1gLFxuICAgICAgICAgICAgICApLmdldCgwKT8ub3V0ZXJIVE1MLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShcbiAgICAgICAgICAgICAgU0VMRUNURURfRUxFTUVOVF9LRVksXG4gICAgICAgICAgICAgIG1vdXNlRHJhZ0RhdGEucGFyZW50U2VsZWN0ZWRFbGVtZW50S2V5LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhaUNvbnRleHRTZWxlY3Rpb24gPSBnZXRNZW1vcnlTdG9yYWdlSXRlbSgnYWlDb250ZXh0Jyk7XG5cbiAgICAgICAgLy8gRG9uJ3QgZW5hYmxlIGRyYWdnaW5nIGlmIHRoZSBBSSBjb250ZXh0IGlzIGVuYWJsZWRcbiAgICAgICAgaWYgKCFhaUNvbnRleHRTZWxlY3Rpb24pIHtcbiAgICAgICAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbSgnbW91c2VEcmFnQ29udGV4dCcsIHtcbiAgICAgICAgICAgIC4uLm1vdXNlRHJhZ0RhdGEsXG4gICAgICAgICAgICBkcmFnZ2luZzogdHJ1ZSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNvbnN0IHNlbGVjdGVkRWxlbWVudEtleSA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKFNFTEVDVEVEX0VMRU1FTlRfS0VZKTtcbiAgICAgICAgICBjb25zdCBzZWxlY3RlZEVsZW1lbnQgPSAkKFxuICAgICAgICAgICAgYC4ke0VMRU1FTlRfS0VZX1BSRUZJWH0ke3NlbGVjdGVkRWxlbWVudEtleX1gLFxuICAgICAgICAgICkuZ2V0KDApO1xuXG4gICAgICAgICAgLy8gVHJpZ2dlciB0aGUgZHJhZyBzdGFydCBldmVudFxuICAgICAgICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5EUkFHX1NUQVJUX0VWRU5ULFxuICAgICAgICAgICAgZXZlbnQ6IG1vdXNlRHJhZ0RhdGEsXG4gICAgICAgICAgICBvdXRlckhUTUw6IHNlbGVjdGVkRWxlbWVudD8ub3V0ZXJIVE1MLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgY29uc3QgYm9keU9iamVjdCA9ICQoJ2JvZHknKS5nZXQoMCk7XG5cbiAgICAgICAgICAvLyBIQUNLOiBNYXJjaCA4LCAyMDI0XG4gICAgICAgICAgLy8gV2l0aG91dCB0aGlzIHdvcmthcm91bmQgZXZlbnRzIHN0YXkgaW5zaWRlIHRoZSBpZnJhbWUgc28gaXQncyBub3QgcG9zc2libGUgdG9cbiAgICAgICAgICAvLyB0cmFjayBtb3VzZSBtb3ZlbWVudHMgb3V0c2lkZSB0aGUgaWZyYW1lIHdoZW4gY2xpY2tpbmcgJiBkcmFnZ2luZy5cbiAgICAgICAgICAvLyBTZXQgdGhlIHBvaW50ZXIgbG9jayBhbmQgaW1tZWRpYXRlbHkgcmVtb3ZlIGl0IHNvIHRoYXRcbiAgICAgICAgICAvLyB0aGUgZXZlbnRzIHN0YXJ0IHRvIHByb3BhZ2F0ZSB1cHdhcmRzIGluIHRoZSBvdXRlciBhcHBsaWNhdGlvbi5cbiAgICAgICAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShJTU1FRElBVEVMWV9SRU1PVkVfUE9JTlRFUl9MT0NLLCB0cnVlKTtcbiAgICAgICAgICBhd2FpdCBib2R5T2JqZWN0Py5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChnZXRNZW1vcnlTdG9yYWdlSXRlbSgnbW91c2VEcmFnQ29udGV4dCcpKSB7XG4gICAgICB1cGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBnZXRQYXJlbnREb21FbGVtZW50Rm9yTmF2Tm9kZSA9IChuYXZOb2RlOiBOYXZUcmVlTm9kZSkgPT4ge1xuICAgIGlmICghbmF2Tm9kZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFuYXZOb2RlPy5pc0NvbXBvbmVudCkge1xuICAgICAgY29uc3QgY2hpbGREb21FbGVtZW50ID0gJChcbiAgICAgICAgYC4ke0VMRU1FTlRfS0VZX1BSRUZJWH0ke25hdk5vZGUudGVtcG9FbGVtZW50LmdldEtleSgpfWAsXG4gICAgICApLmdldCgwKTtcbiAgICAgIHJldHVybiBjaGlsZERvbUVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyB0aGUgbGlzdCBvZiByZWFsIERPTSBlbGVtZW50cyB0aGF0IGFyZSBhdCB0aGUgdG9wIGxldmVsIG9mIHRoaXMgY29tcG9uZW50XG4gICAgY29uc3QgZWxlbWVudEtleVRvTG9va3VwTGlzdDogYW55ID1cbiAgICAgIGdldE1lbW9yeVN0b3JhZ2VJdGVtKEVMRU1FTlRfS0VZX1RPX0xPT0tVUF9MSVNUKSB8fCB7fTtcblxuICAgIGNvbnN0IGxvb2t1cExpc3QgPVxuICAgICAgZWxlbWVudEtleVRvTG9va3VwTGlzdFtuYXZOb2RlLnRlbXBvRWxlbWVudC5nZXRLZXkoKV0gfHwgW107XG4gICAgbGV0IGNoaWxkRG9tRWxlbWVudDogYW55O1xuICAgIGxvb2t1cExpc3QuZm9yRWFjaCgobG9va3VwRWxlbWVudEtleTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoY2hpbGREb21FbGVtZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY2hpbGREb21FbGVtZW50ID0gJChgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7bG9va3VwRWxlbWVudEtleX1gKS5nZXQoMCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY2hpbGREb21FbGVtZW50Py5wYXJlbnRFbGVtZW50O1xuICB9O1xuXG4gIGNvbnN0IG9uUG9pbnRlckRvd24gPSAoZTogYW55LCBwYXJlbnRQb3J0OiBhbnksIHN0b3J5Ym9hcmRJZDogc3RyaW5nKSA9PiB7XG4gICAgLy8gVGhpcyB2YXJpYWJsZSBkZXRlcm1pbmVzIHdoaWNoIGJ1dHRvbiB3YXMgdXNlZFxuICAgIC8vIDEgLT4gbGVmdCwgMiAtPiBtaWRkbGUsIDMgLT4gcmlnaHRcbiAgICBpZiAoZS53aGljaCAhPT0gMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFsbG93IHRoZSBlZGl0IGR5bmFtaWMgdGV4dCBidXR0b24gdG8gYmUgY2xpY2tlZFxuICAgIGlmIChoYXNDbGFzcyhlLnRhcmdldCwgRURJVF9URVhUX0JVVFRPTikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXNzZWRUaHJvdWdoID0gcGFzc1Rocm91Z2hFdmVudHNJZk5lZWRlZChcbiAgICAgIGUsXG4gICAgICBwYXJlbnRQb3J0LFxuICAgICAgc3Rvcnlib2FyZElkLFxuICAgICk7XG4gICAgaWYgKHBhc3NlZFRocm91Z2gpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3RlZEVsZW1lbnRLZXkgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShTRUxFQ1RFRF9FTEVNRU5UX0tFWSk7XG4gICAgY29uc3Qgc2VsZWN0ZWRFbGVtZW50ID0gVGVtcG9FbGVtZW50LmZyb21LZXkoc2VsZWN0ZWRFbGVtZW50S2V5KTtcbiAgICBjb25zdCBzZWxlY3RlZE5hdk5vZGUgPSBvblNlbGVjdEVsZW1lbnQoZSwgcGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcblxuICAgIGNvbnN0IHVzZVNlbGVjdGVkSWZEcmFnZ2luZyA9XG4gICAgICAhc2VsZWN0ZWRFbGVtZW50LmlzRW1wdHkoKSAmJlxuICAgICAgc2VsZWN0ZWRFbGVtZW50LmlzUGFyZW50T2Yoc2VsZWN0ZWROYXZOb2RlPy50ZW1wb0VsZW1lbnQpO1xuXG4gICAgbGV0IG9mZnNldFgsIG9mZnNldFk7XG5cbiAgICBpZiAoc2VsZWN0ZWROYXZOb2RlPy5wYWdlQm91bmRpbmdCb3gpIHtcbiAgICAgIG9mZnNldFggPVxuICAgICAgICBzZWxlY3RlZE5hdk5vZGUucGFnZUJvdW5kaW5nQm94LnBhZ2VYICtcbiAgICAgICAgc2VsZWN0ZWROYXZOb2RlLnBhZ2VCb3VuZGluZ0JveC53aWR0aCAvIDIgLVxuICAgICAgICBlLnBhZ2VYO1xuICAgICAgb2Zmc2V0WSA9XG4gICAgICAgIHNlbGVjdGVkTmF2Tm9kZS5wYWdlQm91bmRpbmdCb3gucGFnZVkgK1xuICAgICAgICBzZWxlY3RlZE5hdk5vZGUucGFnZUJvdW5kaW5nQm94LmhlaWdodCAvIDIgLVxuICAgICAgICBlLnBhZ2VZO1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydGFudEZpZWxkczogYW55ID0ge1xuICAgICAgcGFnZVg6IGUucGFnZVgsXG4gICAgICBwYWdlWTogZS5wYWdlWSxcblxuICAgICAgLy8gVGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB3aGVyZSB0aGUgdXNlciBjbGlja2VkIGFuZCB0aGUgY2VudGVyIG9mIHRoZSBlbGVtZW50XG4gICAgICBvZmZzZXRYLFxuICAgICAgb2Zmc2V0WSxcblxuICAgICAgLy8gVXNlZCB0byByZXNlbGVjdCB0aGUgcGFyZW50IGlmIHRoZSB1c2VyIHN0YXJ0cyB0byBtb3ZlXG4gICAgICBwYXJlbnRTZWxlY3RlZEVsZW1lbnRLZXk6IHVzZVNlbGVjdGVkSWZEcmFnZ2luZ1xuICAgICAgICA/IHNlbGVjdGVkRWxlbWVudEtleVxuICAgICAgICA6IG51bGwsXG4gICAgfTtcblxuICAgIGNvbnN0IGVsZW1lbnRLZXlUb05hdk5vZGUgPVxuICAgICAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oRUxFTUVOVF9LRVlfVE9fTkFWX05PREUpIHx8IHt9O1xuXG4gICAgLy8gR2V0IHRoZSBwYXJlbnQgZWxlbWVudCAoYWN0dWFsIERPTSBlbGVtZW50KSB0aGF0IHRoaXMgbm9kZSBpcyBiZWluZyBkcmFnZ2VkIGluc2lkZVxuICAgIC8vIFRvIGRvIHRoaXMgcGljayBvbmUgY2hpbGQgZWxlbWVudCB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgKGNhbiBiZSBtdWx0aXBsZSBjaGlsZHJlbiBpZiB0aGUgbm9kZSBiZWluZyBkcmFnZ2VkIGlzIGEgY29tcG9uZW50KSxcbiAgICAvLyBhbmQgZ2V0IGl0cyBwYXJlbnQgaW4gdGhlIERPTVxuICAgIGNvbnN0IG5hdk5vZGVUb1VzZUZvckRyYWdnaW5nID0gdXNlU2VsZWN0ZWRJZkRyYWdnaW5nXG4gICAgICA/IGVsZW1lbnRLZXlUb05hdk5vZGVbc2VsZWN0ZWRFbGVtZW50S2V5XVxuICAgICAgOiBzZWxlY3RlZE5hdk5vZGU7XG5cbiAgICBjb25zdCBwYXJlbnREb21FbGVtZW50ID0gZ2V0UGFyZW50RG9tRWxlbWVudEZvck5hdk5vZGUoXG4gICAgICBuYXZOb2RlVG9Vc2VGb3JEcmFnZ2luZyxcbiAgICApO1xuXG4gICAgaWYgKHBhcmVudERvbUVsZW1lbnQpIHtcbiAgICAgIGltcG9ydGFudEZpZWxkc1snc2VsZWN0ZWRQYXJlbnREaXNwbGF5J10gPSBjc3NFdmFsKFxuICAgICAgICBwYXJlbnREb21FbGVtZW50LFxuICAgICAgICAnZGlzcGxheScsXG4gICAgICApO1xuICAgICAgaW1wb3J0YW50RmllbGRzWydzZWxlY3RlZFBhcmVudEZsZXhEaXJlY3Rpb24nXSA9IGNzc0V2YWwoXG4gICAgICAgIHBhcmVudERvbUVsZW1lbnQsXG4gICAgICAgICdmbGV4LWRpcmVjdGlvbicsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGFpQ29udGV4dFNlbGVjdGlvbiA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKCdhaUNvbnRleHQnKTtcblxuICAgIC8vIERvbid0IGVuYWJsZSBkcmFnZ2luZyBpZiB0aGUgQUkgY29udGV4dCBpcyBlbmFibGVkXG4gICAgaWYgKCFhaUNvbnRleHRTZWxlY3Rpb24pIHtcbiAgICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKCdtb3VzZURyYWdDb250ZXh0JywgaW1wb3J0YW50RmllbGRzKTtcbiAgICB9XG5cbiAgICB1cGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICB9O1xuXG4gIGNvbnN0IG9uUG9pbnRlclVwID0gKGU6IGFueSwgcGFyZW50UG9ydDogYW55LCBzdG9yeWJvYXJkSWQ6IHN0cmluZykgPT4ge1xuICAgIHBhc3NUaHJvdWdoRXZlbnRzSWZOZWVkZWQoZSwgcGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcblxuICAgIGNvbnN0IG1vdXNlRHJhZ0RhdGEgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbSgnbW91c2VEcmFnQ29udGV4dCcpO1xuXG4gICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oJ21vdXNlRHJhZ0NvbnRleHQnLCBudWxsKTtcblxuICAgIGlmIChtb3VzZURyYWdEYXRhPy5kcmFnZ2luZykge1xuICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuRFJBR19FTkRfRVZFTlQsXG4gICAgICAgIGV2ZW50OiB7fSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gIH07XG5cbiAgY29uc3Qgb25TZWxlY3RFbGVtZW50ID0gKFxuICAgIGU6IGFueSxcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICk6IE5hdlRyZWVOb2RlIHwgbnVsbCA9PiB7XG4gICAgY29uc3QgZHJpdmVNb2RlRW5hYmxlZCA9ICEhZ2V0U2Vzc2lvblN0b3JhZ2VJdGVtKFxuICAgICAgJ2RyaXZlTW9kZUVuYWJsZWQnLFxuICAgICAgc3Rvcnlib2FyZElkLFxuICAgICk7XG5cbiAgICBpZiAoZHJpdmVNb2RlRW5hYmxlZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudEtleVRvTmF2Tm9kZSA9XG4gICAgICBnZXRNZW1vcnlTdG9yYWdlSXRlbShFTEVNRU5UX0tFWV9UT19OQVZfTk9ERSkgfHwge307XG5cbiAgICBsZXQgc2VsZWN0ZWROYXZOb2RlOiBOYXZUcmVlTm9kZSB8IG51bGwgfCBzdHJpbmc7XG4gICAgaWYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRLZXk6IGFueSA9IGdldEVsZW1lbnRLZXlGcm9tTm9kZShlLnRhcmdldCk7XG4gICAgICBzZWxlY3RlZE5hdk5vZGUgPSBlbGVtZW50S2V5VG9OYXZOb2RlW2VsZW1lbnRLZXldO1xuXG4gICAgICAvLyBTcGVjaWFsIGNhc2UgLT4gdGhpcyBpcyB0aGUgdG9wLW1vc3Qgbm9kZSBzbyBpdCBzaG91bGQgdHJpZ2dlciBhIHNlbGVjdCBvbiB0aGUgc3Rvcnlib2FyZFxuICAgICAgaWYgKCFzZWxlY3RlZE5hdk5vZGUgJiYgZS50YXJnZXQucGFyZW50Tm9kZSA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICBzZWxlY3RlZE5hdk5vZGUgPSBTRUxFQ1RfT1JfSE9WRVJfU1RPUllCT0FSRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZWN0ZWROYXZOb2RlID0gZ2V0U2VsZWN0YWJsZU5hdk5vZGUoZSk7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFNlbGVjdGVkRWxlbWVudEtleSA9XG4gICAgICBnZXRNZW1vcnlTdG9yYWdlSXRlbShTRUxFQ1RFRF9FTEVNRU5UX0tFWSk7XG5cbiAgICAvLyBJZiB0aGlzIGlzIG5vdCBhIHZhbGlkIG5hdiBub2RlLCBpdCdzIG5vdCBzb21ldGhpbmcgd2UgdHJhY2sgLSBkZXNlbGVjdCBhbGxcbiAgICBpZiAoIXNlbGVjdGVkTmF2Tm9kZSkge1xuICAgICAgaWYgKGN1cnJlbnRTZWxlY3RlZEVsZW1lbnRLZXkpIHtcbiAgICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5TRUxFQ1RFRF9FTEVNRU5UX0tFWSxcbiAgICAgICAgICBlbGVtZW50S2V5OiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVksIG51bGwpO1xuXG4gICAgICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRTZWxlY3RlZEVsZW1lbnQgPSBUZW1wb0VsZW1lbnQuZnJvbUtleShcbiAgICAgIGN1cnJlbnRTZWxlY3RlZEVsZW1lbnRLZXksXG4gICAgKTtcbiAgICBjb25zdCBjdXJyZW50TXVsdGlTZWxlY3RlZEtleXM6IHN0cmluZ1tdID1cbiAgICAgIGdldE1lbW9yeVN0b3JhZ2VJdGVtKE1VTFRJX1NFTEVDVEVEX0VMRU1FTlRfS0VZUykgfHwgW107XG5cbiAgICBsZXQgbmV3U2VsZWN0ZWRFbGVtZW50ID1cbiAgICAgIHR5cGVvZiBzZWxlY3RlZE5hdk5vZGUgPT09ICdzdHJpbmcnXG4gICAgICAgID8gVGVtcG9FbGVtZW50LmZvclN0b3J5Ym9hcmQoc3Rvcnlib2FyZElkKVxuICAgICAgICA6IHNlbGVjdGVkTmF2Tm9kZS50ZW1wb0VsZW1lbnQ7XG4gICAgbGV0IG5ld011bHRpU2VsZWN0S2V5czogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIElmIHRoZSB1c2VyIGlzIGhvbGRpbmcgc2hpZnQsIGNoZWNrIGlmIHdlIGNhbiBtdWx0aS1zZWxlY3QgKHNvbWV0aGluZyBoYXMgdG8gYmUgYWxyZWFkeSBzZWxlY3RlZClcbiAgICAvLyBOb3RlOiB0aGlzIGxvZ2ljIGdlbmVyYWxseSBtYXRjaGVzIHRoZSBsb2dpYyBpbiB0aGUgaWZyYW1lIHNsaWNlIG9uIHRlbXBvLXdlYlxuICAgIGlmIChlLnNoaWZ0S2V5ICYmIGN1cnJlbnRTZWxlY3RlZEVsZW1lbnRLZXkpIHtcbiAgICAgIC8vIEZpcnN0IGNoZWNrIGlmIHdlIGFyZSBkZXNlbGVjdGluZ1xuICAgICAgY29uc3QgZWxlbWVudFRvRGVzZWxlY3QgPSBjdXJyZW50TXVsdGlTZWxlY3RlZEtleXNcbiAgICAgICAgLm1hcCgoZWxlbWVudEtleTogc3RyaW5nKSA9PiBUZW1wb0VsZW1lbnQuZnJvbUtleShlbGVtZW50S2V5KSlcbiAgICAgICAgLmZpbmQoKGVsZW1lbnQ6IFRlbXBvRWxlbWVudCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBlbGVtZW50LmlzUGFyZW50T2YobmV3U2VsZWN0ZWRFbGVtZW50KSB8fFxuICAgICAgICAgICAgZWxlbWVudC5pc0VxdWFsKG5ld1NlbGVjdGVkRWxlbWVudClcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgaWYgKGVsZW1lbnRUb0Rlc2VsZWN0KSB7XG4gICAgICAgIG5ld011bHRpU2VsZWN0S2V5cyA9IGN1cnJlbnRNdWx0aVNlbGVjdGVkS2V5cy5maWx0ZXIoXG4gICAgICAgICAgKGVsZW1lbnRLZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRLZXkgIT09IGVsZW1lbnRUb0Rlc2VsZWN0LmdldEtleSgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUGljayBhIG5ldyBlbGVtZW50IHRvIGJlIHRoZSBtYWluIHNlbGVjdGVkIGVsZW1lbnRcbiAgICAgICAgLy8gTm90ZSwgaWYgdGhlIGxlbmd0aCBpcyAxLCB0aGVyZSBpcyBsb2dpYyBmdXJ0aGVyIGRvd24gdG8gaGFuZGxlIHRoYXQgY2FzZSBleHBsaWNpdGx5ICh0byBleGl0IG11bHRpc2VsZWN0IG1vZGUpXG4gICAgICAgIGlmIChcbiAgICAgICAgICBlbGVtZW50VG9EZXNlbGVjdC5pc0VxdWFsKGN1cnJlbnRTZWxlY3RlZEVsZW1lbnQpICYmXG4gICAgICAgICAgbmV3TXVsdGlTZWxlY3RLZXlzLmxlbmd0aCA+IDFcbiAgICAgICAgKSB7XG4gICAgICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLlNFTEVDVEVEX0VMRU1FTlRfS0VZLFxuICAgICAgICAgICAgZWxlbWVudEtleTogbmV3TXVsdGlTZWxlY3RLZXlzWzBdLFxuICAgICAgICAgICAgb3V0ZXJIVE1MOiAkKGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtuZXdNdWx0aVNlbGVjdEtleXNbMF19YCkuZ2V0KFxuICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgKT8ub3V0ZXJIVE1MLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKFNFTEVDVEVEX0VMRU1FTlRfS0VZLCBuZXdNdWx0aVNlbGVjdEtleXNbMF0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIENoZWNrIGlmIHdlIGNhbiBhZGQgdGhpcyBlbGVtZW50XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRTZWxlY3RlZEVsZW1lbnQuaXNTaWJsaW5nT2YobmV3U2VsZWN0ZWRFbGVtZW50KSkge1xuICAgICAgICBpZiAoY3VycmVudE11bHRpU2VsZWN0ZWRLZXlzPy5sZW5ndGgpIHtcbiAgICAgICAgICBuZXdNdWx0aVNlbGVjdEtleXMgPSBjdXJyZW50TXVsdGlTZWxlY3RlZEtleXMuY29uY2F0KFtcbiAgICAgICAgICAgIG5ld1NlbGVjdGVkRWxlbWVudC5nZXRLZXkoKSxcbiAgICAgICAgICBdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdNdWx0aVNlbGVjdEtleXMgPSBbXG4gICAgICAgICAgICBjdXJyZW50U2VsZWN0ZWRFbGVtZW50S2V5LFxuICAgICAgICAgICAgbmV3U2VsZWN0ZWRFbGVtZW50LmdldEtleSgpLFxuICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgY2FzZSB0aGUgdXNlciBpcyB0cnlpbmcgdG8gbXVsdGlzZWxlY3QgYnV0IGl0J3Mgbm90IHNvbWV0aGluZyB0aGF0J3MgYWxsb3dlZCwganVzdCByZXR1cm4gYnV0IGRvbid0IG1ha2UgYW55IGNoYW5nZXNcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSW4gbXVsdGlzZWxlY3QgbW9kZSwgc2V0IHRoZSBuZWNlc3NhcnkgdmFsdWVzXG4gICAgaWYgKG5ld011bHRpU2VsZWN0S2V5cy5sZW5ndGggPiAxKSB7XG4gICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5NVUxUSV9TRUxFQ1RFRF9FTEVNRU5UX0tFWVMsXG4gICAgICAgIGVsZW1lbnRLZXlzOiBuZXdNdWx0aVNlbGVjdEtleXMsXG4gICAgICAgIG91dGVySFRNTHM6IG5ld011bHRpU2VsZWN0S2V5cz8ubWFwKFxuICAgICAgICAgIChlbGVtZW50S2V5KSA9PlxuICAgICAgICAgICAgJChgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7ZWxlbWVudEtleX1gKS5nZXQoMCk/Lm91dGVySFRNTCxcbiAgICAgICAgKSxcbiAgICAgIH0pO1xuICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oTVVMVElfU0VMRUNURURfRUxFTUVOVF9LRVlTLCBuZXdNdWx0aVNlbGVjdEtleXMpO1xuICAgICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcblxuICAgICAgdGVhcmRvd25FZGl0YWJsZVRleHQocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICAgIHJldHVybiBudWxsOyAvLyBDYW5ub3QgcGVyZm9ybSByZWd1bGFyIGFjdGlvbnMgb24gYW55IHBhcnRpY3VsYXIgbm9kZVxuICAgIH1cblxuICAgIC8vIFNwZWNpYWwgY2FzZSAtIG11bHRpc2VsZWN0aW5nIGJ1dCBkZXNlbGVjdGluZyBkb3duIHRvIDEsIHN0b3AgdGhlIG11bHRpc2VsZWN0IG1vZGVcbiAgICBpZiAobmV3TXVsdGlTZWxlY3RLZXlzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgbmV3U2VsZWN0ZWRFbGVtZW50ID0gVGVtcG9FbGVtZW50LmZyb21LZXkobmV3TXVsdGlTZWxlY3RLZXlzWzBdKTtcbiAgICB9XG5cbiAgICBjb25zdCBjbGVhck11bHRpU2VsZWN0U3RhdGUgPSAoKSA9PiB7XG4gICAgICAvLyBOb3QgbXVsdGktc2VsZWN0aW5nLCBzbyBjbGVhciB0aGUgbXVsdGlzZWxlY3Qgc3RhdGVcbiAgICAgIC8vIFdhbnQgdG8gZG8gdGhpcyBhZnRlciBzZXR0aW5nIHRoZSBzZWxlY3RlZCBlbGVtZW50IHRvIHByZXZlbnQgZmxhc2hpbmdcbiAgICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLk1VTFRJX1NFTEVDVEVEX0VMRU1FTlRfS0VZUyxcbiAgICAgICAgZWxlbWVudEtleXM6IFtdLFxuICAgICAgICBvdXRlckhUTUxzOiBbXSxcbiAgICAgIH0pO1xuICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oTVVMVElfU0VMRUNURURfRUxFTUVOVF9LRVlTLCBudWxsKTtcbiAgICB9O1xuXG4gICAgLy8gU2VsZWN0aW5nIHRoZSBzdG9yeWJvYXJkIGZyb20gd2l0aGluXG4gICAgaWYgKG5ld1NlbGVjdGVkRWxlbWVudC5pc1N0b3J5Ym9hcmQoKSkge1xuICAgICAgaWYgKG5ld1NlbGVjdGVkRWxlbWVudC5nZXRLZXkoKSAhPT0gY3VycmVudFNlbGVjdGVkRWxlbWVudEtleSkge1xuICAgICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLlNFTEVDVEVEX0VMRU1FTlRfS0VZLFxuICAgICAgICAgIGVsZW1lbnRLZXk6IG5ld1NlbGVjdGVkRWxlbWVudC5nZXRLZXkoKSxcbiAgICAgICAgICBvdXRlckhUTUw6ICQoXG4gICAgICAgICAgICBgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7bmV3U2VsZWN0ZWRFbGVtZW50LmdldEtleSgpfWAsXG4gICAgICAgICAgKS5nZXQoMCk/Lm91dGVySFRNTCxcbiAgICAgICAgfSk7XG4gICAgICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKFNFTEVDVEVEX0VMRU1FTlRfS0VZLCBuZXdTZWxlY3RlZEVsZW1lbnQuZ2V0S2V5KCkpO1xuXG4gICAgICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9XG5cbiAgICAgIHRlYXJkb3duRWRpdGFibGVUZXh0KHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICBjbGVhck11bHRpU2VsZWN0U3RhdGUoKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50bHlFZGl0aW5nKCkpIHtcbiAgICAgIGNvbnN0IGVkaXRpbmdJbmZvID0gZ2V0RWRpdGluZ0luZm8oKTtcblxuICAgICAgaWYgKGVkaXRpbmdJbmZvPy5rZXkgIT09IGN1cnJlbnRTZWxlY3RlZEVsZW1lbnRLZXkpIHtcbiAgICAgICAgdGVhcmRvd25FZGl0YWJsZVRleHQocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICAgIH1cblxuICAgICAgY2xlYXJNdWx0aVNlbGVjdFN0YXRlKCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIGlmIChcbiAgICAgIGNhbkVkaXRUZXh0KG5ld1NlbGVjdGVkRWxlbWVudCkgJiZcbiAgICAgIG5ld1NlbGVjdGVkRWxlbWVudC5nZXRLZXkoKSA9PT0gY3VycmVudFNlbGVjdGVkRWxlbWVudEtleVxuICAgICkge1xuICAgICAgc2V0dXBFZGl0YWJsZVRleHQobmV3U2VsZWN0ZWRFbGVtZW50LCBwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgIH1cblxuICAgIGlmIChuZXdTZWxlY3RlZEVsZW1lbnQuZ2V0S2V5KCkgPT09IGN1cnJlbnRTZWxlY3RlZEVsZW1lbnRLZXkpIHtcbiAgICAgIGNsZWFyTXVsdGlTZWxlY3RTdGF0ZSgpO1xuICAgICAgcmV0dXJuIHNlbGVjdGVkTmF2Tm9kZSBhcyBOYXZUcmVlTm9kZTtcbiAgICB9XG5cbiAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuU0VMRUNURURfRUxFTUVOVF9LRVksXG4gICAgICBlbGVtZW50S2V5OiBuZXdTZWxlY3RlZEVsZW1lbnQuZ2V0S2V5KCksXG4gICAgICBvdXRlckhUTUw6ICQoYC4ke0VMRU1FTlRfS0VZX1BSRUZJWH0ke25ld1NlbGVjdGVkRWxlbWVudC5nZXRLZXkoKX1gKS5nZXQoXG4gICAgICAgIDAsXG4gICAgICApPy5vdXRlckhUTUwsXG4gICAgfSk7XG4gICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVksIG5ld1NlbGVjdGVkRWxlbWVudC5nZXRLZXkoKSk7XG4gICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICBjbGVhck11bHRpU2VsZWN0U3RhdGUoKTtcbiAgICByZXR1cm4gc2VsZWN0ZWROYXZOb2RlIGFzIE5hdlRyZWVOb2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGlmIGV2ZW50cyB3ZXJlIHBhc3NlZCB0aHJvdWdoXG4gICAqL1xuICBjb25zdCBwYXNzVGhyb3VnaEV2ZW50c0lmTmVlZGVkID0gKFxuICAgIGU6IGFueSxcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IGRyaXZlTW9kZUVuYWJsZWQgPSAhIWdldFNlc3Npb25TdG9yYWdlSXRlbShcbiAgICAgICdkcml2ZU1vZGVFbmFibGVkJyxcbiAgICAgIHN0b3J5Ym9hcmRJZCxcbiAgICApO1xuICAgIGNvbnN0IGVkaXRpbmdUZXh0SW5mbyA9IGdldEVkaXRpbmdJbmZvKCk7XG5cbiAgICBpZiAoZHJpdmVNb2RlRW5hYmxlZCB8fCBlZGl0aW5nVGV4dEluZm8pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGU/LnByZXZlbnREZWZhdWx0Py4oKTtcbiAgICBlPy5zdG9wUHJvcGFnYXRpb24/LigpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICBjb25zdCBvbkNsaWNrRWxlbWVudENvbnRleHRNZW51ID0gKFxuICAgIGU6IGFueSxcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICkgPT4ge1xuICAgIGNvbnN0IHBhc3NlZFRocm91Z2ggPSBwYXNzVGhyb3VnaEV2ZW50c0lmTmVlZGVkKFxuICAgICAgZSxcbiAgICAgIHBhcmVudFBvcnQsXG4gICAgICBzdG9yeWJvYXJkSWQsXG4gICAgKTtcbiAgICBpZiAocGFzc2VkVGhyb3VnaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgLy8gTW91c2UgZG93biBpcyBjYWxsZWQgd2hlbiBhIHVzZXIgY2xpY2tzIHRoZSBjb250ZXh0IG1lbnUsIGJ1dCBub3QgbW91c2UgdXAsIHNvIGNsZWFyIHRoZSBtb3VzZSBkb3duXG4gICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oJ21vdXNlRHJhZ0NvbnRleHQnLCBudWxsKTtcblxuICAgIGNvbnN0IGVsZW1lbnRLZXlUb05hdk5vZGUgPVxuICAgICAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oRUxFTUVOVF9LRVlfVE9fTkFWX05PREUpIHx8IHt9O1xuXG4gICAgbGV0IHJlcXVlc3RlZE5hdk5vZGU6IE5hdlRyZWVOb2RlIHwgbnVsbCB8IHN0cmluZztcbiAgICBpZiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSkge1xuICAgICAgY29uc3QgZWxlbWVudEtleTogYW55ID0gZ2V0RWxlbWVudEtleUZyb21Ob2RlKGUudGFyZ2V0KTtcbiAgICAgIHJlcXVlc3RlZE5hdk5vZGUgPSBlbGVtZW50S2V5VG9OYXZOb2RlW2VsZW1lbnRLZXldO1xuXG4gICAgICAvLyBTcGVjaWFsIGNhc2UgLT4gdGhpcyBpcyB0aGUgdG9wLW1vc3Qgbm9kZSBzbyBpdCBzaG91bGQgdHJpZ2dlciBhIGNvbnRleHQgbWVudSBvbiB0aGUgc3Rvcnlib2FyZFxuICAgICAgaWYgKCFyZXF1ZXN0ZWROYXZOb2RlICYmIGUudGFyZ2V0LnBhcmVudE5vZGUgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgcmVxdWVzdGVkTmF2Tm9kZSA9IFNFTEVDVF9PUl9IT1ZFUl9TVE9SWUJPQVJEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXF1ZXN0ZWROYXZOb2RlID0gZ2V0U2VsZWN0YWJsZU5hdk5vZGUoZSk7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFNlbGVjdGVkRWxlbWVudEtleSA9XG4gICAgICBnZXRNZW1vcnlTdG9yYWdlSXRlbShTRUxFQ1RFRF9FTEVNRU5UX0tFWSk7XG4gICAgY29uc3QgY3VycmVudE11bHRpU2VsZWN0ZWRLZXlzID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oXG4gICAgICBNVUxUSV9TRUxFQ1RFRF9FTEVNRU5UX0tFWVMsXG4gICAgKTtcblxuICAgIGlmICghcmVxdWVzdGVkTmF2Tm9kZSB8fCB0eXBlb2YgcmVxdWVzdGVkTmF2Tm9kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChcbiAgICAgICAgcmVxdWVzdGVkTmF2Tm9kZSA9PT0gU0VMRUNUX09SX0hPVkVSX1NUT1JZQk9BUkQgJiZcbiAgICAgICAgIWN1cnJlbnRNdWx0aVNlbGVjdGVkS2V5cz8ubGVuZ3RoXG4gICAgICApIHtcbiAgICAgICAgY29uc3Qgc3Rvcnlib2FyZEtleSA9IFRlbXBvRWxlbWVudC5mb3JTdG9yeWJvYXJkKHN0b3J5Ym9hcmRJZCkuZ2V0S2V5KCk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRTZWxlY3RlZEVsZW1lbnRLZXkgPT09IHN0b3J5Ym9hcmRLZXkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLlNFTEVDVEVEX0VMRU1FTlRfS0VZLFxuICAgICAgICAgIGVsZW1lbnRLZXk6IHN0b3J5Ym9hcmRLZXksXG4gICAgICAgIH0pO1xuICAgICAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShTRUxFQ1RFRF9FTEVNRU5UX0tFWSwgc3Rvcnlib2FyZEtleSk7XG5cbiAgICAgICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgY29udGV4dFJlcXVlc3RlZEVsZW1lbnRLZXk6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gICAgY29uc3Qgc2VsZWN0ZWRFbGVtZW50S2V5ID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVkpO1xuICAgIGNvbnN0IHNlbGVjdGVkRWxlbWVudCA9IFRlbXBvRWxlbWVudC5mcm9tS2V5KHNlbGVjdGVkRWxlbWVudEtleSk7XG5cbiAgICAvLyBEb24ndCBzZWxlY3QgYW55IGNoaWxkcmVuIGFzIHRoZSB1c2VyIG1pZ2h0IGJlIHJpZ2h0IGNsaWNraW5nIGEgbm9kZSB0aGV5IHNlbGVjdGVkXG4gICAgaWYgKFxuICAgICAgIXJlcXVlc3RlZE5hdk5vZGUudGVtcG9FbGVtZW50LmlzRXF1YWwoc2VsZWN0ZWRFbGVtZW50KSAmJlxuICAgICAgIXNlbGVjdGVkRWxlbWVudC5pc1BhcmVudE9mKHJlcXVlc3RlZE5hdk5vZGUudGVtcG9FbGVtZW50KSAmJlxuICAgICAgIWN1cnJlbnRNdWx0aVNlbGVjdGVkS2V5cz8ubGVuZ3RoIC8vIEFsc28gZG9uJ3Qgc2VsZWN0IGFueXRoaW5nIG5ldyBpZiBpbiBtdWx0aXNlbGVjdCBtb2RlXG4gICAgKSB7XG4gICAgICBjb250ZXh0UmVxdWVzdGVkRWxlbWVudEtleSA9IHJlcXVlc3RlZE5hdk5vZGUudGVtcG9FbGVtZW50LmdldEtleSgpO1xuXG4gICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5TRUxFQ1RFRF9FTEVNRU5UX0tFWSxcbiAgICAgICAgZWxlbWVudEtleTogY29udGV4dFJlcXVlc3RlZEVsZW1lbnRLZXksXG4gICAgICAgIG91dGVySFRNTDogJChgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7Y29udGV4dFJlcXVlc3RlZEVsZW1lbnRLZXl9YCkuZ2V0KFxuICAgICAgICAgIDAsXG4gICAgICAgICk/Lm91dGVySFRNTCxcbiAgICAgIH0pO1xuICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVksIGNvbnRleHRSZXF1ZXN0ZWRFbGVtZW50S2V5KTtcbiAgICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0YW50RmllbGRzID0ge1xuICAgICAgY2xpZW50WDogZS5jbGllbnRYLFxuICAgICAgY2xpZW50WTogZS5jbGllbnRZLFxuICAgIH07XG5cbiAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuQ09OVEVYVF9SRVFVRVNURUQsXG4gICAgICBldmVudDogaW1wb3J0YW50RmllbGRzLFxuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IGJ1aWxkQW5kU2VuZE5hdlRyZWUgPSAoXG4gICAgcGFyZW50UG9ydDogYW55LFxuICAgIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuICAgIHRyZWVFbGVtZW50TG9va3VwPzogYW55LFxuICAgIHNjb3BlTG9va3VwPzogYW55LFxuICAgIHN0b3J5Ym9hcmRDb21wb25lbnRFbGVtZW50PzogYW55LFxuICApID0+IHtcbiAgICBsZXQgdHJlZUVsZW1lbnRzID0gdHJlZUVsZW1lbnRMb29rdXA7XG4gICAgaWYgKCF0cmVlRWxlbWVudHMpIHtcbiAgICAgIHRyZWVFbGVtZW50cyA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKFRSRUVfRUxFTUVOVF9MT09LVVApIHx8IHt9O1xuICAgIH1cblxuICAgIGxldCBzY29wZXMgPSBzY29wZUxvb2t1cDtcbiAgICBpZiAoIXNjb3Blcykge1xuICAgICAgc2NvcGVzID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0NPUEVfTE9PS1VQKSB8fCB7fTtcbiAgICB9XG5cbiAgICBsZXQgc3Rvcnlib2FyZENvbXBvbmVudCA9IHN0b3J5Ym9hcmRDb21wb25lbnRFbGVtZW50O1xuICAgIGlmIChzdG9yeWJvYXJkQ29tcG9uZW50RWxlbWVudCA9PT0gJ0VYUExJQ0lUX05PTkUnKSB7XG4gICAgICBzdG9yeWJvYXJkQ29tcG9uZW50ID0gbnVsbDtcbiAgICB9IGVsc2UgaWYgKCFzdG9yeWJvYXJkQ29tcG9uZW50KSB7XG4gICAgICBzdG9yeWJvYXJkQ29tcG9uZW50ID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oU1RPUllCT0FSRF9DT01QT05FTlQpIHx8IHt9O1xuICAgIH1cblxuICAgIGNvbnN0IHJvb3RSZWFjdEVsZW1lbnQgPSBnZXRSb290UmVhY3RFbGVtZW50KCk7XG5cbiAgICBjb25zdCByZWFjdFRyZWUgPSBidWlsZE5vZGVUcmVlKHJvb3RSZWFjdEVsZW1lbnQsIG51bGwpO1xuICAgIGNvbnN0IGxvb2t1cElkVG9SZWFjdFRyZWVNYXAgPSB7fTtcbiAgICBidWlsZFRyZWVMb29rdXBNYXAocmVhY3RUcmVlLCBsb29rdXBJZFRvUmVhY3RUcmVlTWFwKTtcblxuICAgIGNvbnN0IGtub3duQ29tcG9uZW50TmFtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBrbm93bkNvbXBvbmVudEluc3RhbmNlTmFtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGlmICh0cmVlRWxlbWVudHMpIHtcbiAgICAgIE9iamVjdC52YWx1ZXModHJlZUVsZW1lbnRzKS5mb3JFYWNoKCh0cmVlRWxlbWVudDogYW55KSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0cmVlRWxlbWVudC50eXBlID09PSAnY29tcG9uZW50JyB8fFxuICAgICAgICAgIHRyZWVFbGVtZW50LnR5cGUgPT09ICdzdG9yeWJvb2stY29tcG9uZW50J1xuICAgICAgICApIHtcbiAgICAgICAgICBrbm93bkNvbXBvbmVudE5hbWVzLmFkZCh0cmVlRWxlbWVudC5jb21wb25lbnROYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cmVlRWxlbWVudC50eXBlID09PSAnY29tcG9uZW50LWluc3RhbmNlJykge1xuICAgICAgICAgIGtub3duQ29tcG9uZW50SW5zdGFuY2VOYW1lcy5hZGQodHJlZUVsZW1lbnQuY29tcG9uZW50TmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnRLZXlUb0xvb2t1cExpc3QgPSB7fTtcbiAgICBjb25zdCBlbGVtZW50S2V5VG9OYXZOb2RlID0ge307XG5cbiAgICBjb25zdCBidWlsdE5hdlRyZWUgPSBidWlsZE5hdkZvck5vZGUoXG4gICAgICBzdG9yeWJvYXJkSWQsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICAkKCdib2R5JykuZ2V0KDApLFxuICAgICAgJycsXG4gICAgICAncm9vdCcsXG4gICAgICBzY29wZXMsXG4gICAgICB0cmVlRWxlbWVudHMsXG4gICAgICBsb29rdXBJZFRvUmVhY3RUcmVlTWFwLFxuICAgICAga25vd25Db21wb25lbnROYW1lcyxcbiAgICAgIGtub3duQ29tcG9uZW50SW5zdGFuY2VOYW1lcyxcbiAgICAgIGVsZW1lbnRLZXlUb0xvb2t1cExpc3QsXG4gICAgICBlbGVtZW50S2V5VG9OYXZOb2RlLFxuICAgICk7XG5cbiAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShFTEVNRU5UX0tFWV9UT19MT09LVVBfTElTVCwgZWxlbWVudEtleVRvTG9va3VwTGlzdCk7XG5cbiAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShDVVJSRU5UX05BVl9UUkVFLCBidWlsdE5hdlRyZWUpO1xuXG4gICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oRUxFTUVOVF9LRVlfVE9fTkFWX05PREUsIGVsZW1lbnRLZXlUb05hdk5vZGUpO1xuXG4gICAgY2xlYXJMb29rdXBzRnJvbVRyZWUocmVhY3RUcmVlKTtcblxuICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5OQVZfVFJFRSxcbiAgICAgIG5hdlRyZWU6IGJ1aWx0TmF2VHJlZSxcbiAgICAgIG91dGVySHRtbDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lm91dGVySFRNTCxcbiAgICB9KTtcblxuICAgIC8vIFJ1biBjYWxsYmFja3NcbiAgICBydW5OYXZUcmVlQnVpbHRDYWxsYmFja3MoKTtcbiAgfTtcblxuICBjb25zdCBvbkZsdXNoU3RhcnQgPSAoKSA9PiB7XG4gICAgLy8gRmluZCBhbGwgaW5zdGFudCB1cGRhdGUgc3R5bGluZyBjbGFzc2VzIHRvIGRlbGV0ZVxuICAgIGNvbnN0IGNsYXNzZXNUb0RlbGV0ZTogc3RyaW5nW10gPSBbXTtcbiAgICAkKGAqW2NsYXNzKj0ke1RFTVBPX0lOU1RBTlRfVVBEQVRFX1NUWUxJTkdfUFJFRklYfV1gKS5lYWNoKChpLCBlbGVtZW50KSA9PiB7XG4gICAgICBjb25zdCBjbGFzc2VzID0gKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8ICcnKS5zcGxpdCgnICcpO1xuICAgICAgY2xhc3Nlcy5mb3JFYWNoKChjbGFzc05hbWUpID0+IHtcbiAgICAgICAgaWYgKGNsYXNzTmFtZS5zdGFydHNXaXRoKFRFTVBPX0lOU1RBTlRfVVBEQVRFX1NUWUxJTkdfUFJFRklYKSkge1xuICAgICAgICAgIGNsYXNzZXNUb0RlbGV0ZS5wdXNoKGNsYXNzTmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgJChgKlske1RFTVBPX0RFTEVURV9BRlRFUl9SRUZSRVNIfT10cnVlXWApLmF0dHIoXG4gICAgICBURU1QT19RVUVVRV9ERUxFVEVfQUZURVJfSE9UX1JFTE9BRCxcbiAgICAgICd0cnVlJyxcbiAgICApO1xuXG4gICAgLy8gQ2xlYXIgdGhlIGFkZCBjbGFzcyBpbnN0YW50IHVwZGF0ZSBxdWV1ZSBhcyB0aG9zZSBpdGVtcyB3aWxsIGJlIGFwcGxpZWQgaW4gdGhlIGhvdCByZWxvYWRcbiAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShBRERfQ0xBU1NfSU5TVEFOVF9VUERBVEVfUVVFVUUsIFtdKTtcblxuICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKCdQT1NUX0hPVF9SRUxPQURfQ0xFQVInLCB7XG4gICAgICBjbGFzc2VzVG9EZWxldGUsXG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgY2xlYXJJbnN0YW50VXBkYXRlc0FuZFNlbmROYXZUcmVlID0gKFxuICAgIHBhcmVudFBvcnQ6IGFueSxcbiAgICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbiAgKSA9PiB7XG4gICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oTEFTVF9OQVZfVFJFRV9SRUZSRVNIX1RJTUUsIG5ldyBEYXRlKCkpO1xuXG4gICAgY29uc3QgeyBjbGFzc2VzVG9EZWxldGUgfSA9XG4gICAgICBnZXRNZW1vcnlTdG9yYWdlSXRlbSgnUE9TVF9IT1RfUkVMT0FEX0NMRUFSJykgfHwge307XG5cbiAgICAvLyBEZWxldGUgYWxsIGluc3RhbnQgdXBkYXRlIGNoYW5nZWQgZWxlbWVudHNcbiAgICAkKGAqWyR7VEVNUE9fUVVFVUVfREVMRVRFX0FGVEVSX0hPVF9SRUxPQUR9PXRydWVdYCkucmVtb3ZlKCk7XG5cbiAgICAvLyBDbGVhciB0aGUgYWRkZWQgZGlzcGxheSBub25lc1xuICAgICQoYC4ke1RFTVBPX0RJU1BMQVlfTk9ORV9VTlRJTF9SRUZSRVNIX0NMQVNTfWApLnJlbW92ZUNsYXNzKFxuICAgICAgVEVNUE9fRElTUExBWV9OT05FX1VOVElMX1JFRlJFU0hfQ0xBU1MsXG4gICAgKTtcbiAgICAkKGAqWyR7VEVNUE9fSU5TVEFOVF9VUERBVEV9PXRydWVdYCkucmVtb3ZlQXR0cihURU1QT19JTlNUQU5UX1VQREFURSk7XG4gICAgJChgKlske1RFTVBPX0RPX05PVF9TSE9XX0lOX05BVl9VTlRJTF9SRUZSRVNIfT10cnVlXWApLnJlbW92ZUF0dHIoXG4gICAgICBURU1QT19ET19OT1RfU0hPV19JTl9OQVZfVU5USUxfUkVGUkVTSCxcbiAgICApO1xuXG4gICAgJChgLiR7VEVNUE9SQVJZX1NUWUxJTkdfQ0xBU1NfTkFNRX1gKS5yZW1vdmVDbGFzcyhcbiAgICAgIFRFTVBPUkFSWV9TVFlMSU5HX0NMQVNTX05BTUUsXG4gICAgKTtcblxuICAgIC8vIEFueSBjbGFzc2VzIG1hcmtlZCB0byBkZWxldGUgYmVmb3JlIHRoZSBob3QgcmVsb2FkXG4gICAgY2xhc3Nlc1RvRGVsZXRlPy5mb3JFYWNoKChjbHM6IHN0cmluZykgPT4ge1xuICAgICAgJChgLiR7Y2xzfWApLnJlbW92ZUNsYXNzKGNscyk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBuZXdBZGRDbGFzc1F1ZXVlID1cbiAgICAgIGdldE1lbW9yeVN0b3JhZ2VJdGVtKEFERF9DTEFTU19JTlNUQU5UX1VQREFURV9RVUVVRSkgfHwgW107XG5cbiAgICAvLyBBbnkgYXR0cmlidXRlcyB0aGF0IHN0YXJ0IHdpdGggdGhlIHN0eWxpbmcgcHJlZml4IGxlZnRvdmVyIG1lYW4gdGhhdCB0aGUgY2xhc3MgbmVlZHMgdG8gYmUgcmUtYXBwbGllZFxuICAgIC8vIHRoZXNlIGFyZSBjbGFzc2VzIHRoYXQgd2VyZSBhZGRlZCBpbiBpbnN0YW50IHVwZGF0ZXMgd2hpbGUgdGhlIGhvdCByZWxvYWQgd2FzIGluIHByb2dyZXNzXG4gICAgbmV3QWRkQ2xhc3NRdWV1ZS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGlmICghaXRlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgY29kZWJhc2VJZCwgY2xhc3NOYW1lIH0gPSBpdGVtO1xuICAgICAgaWYgKGNvZGViYXNlSWQgJiYgY2xhc3NOYW1lKSB7XG4gICAgICAgICQoYC4ke2NvZGViYXNlSWR9YCkuYXR0cihURU1QT19JTlNUQU5UX1VQREFURSwgJ3RydWUnKTtcblxuICAgICAgICAkKGAuJHtjb2RlYmFzZUlkfWApLmFkZENsYXNzKGNsYXNzTmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBSZWJ1aWxkIHRoZSBuYXYgdHJlZSBvbiBET00gY2hhbmdlZCBhZnRlciBzb21lIHRpbWUgaGFzIHBhc3NlZFxuICAgIC8vIHRoaXMgZ2l2ZXMgdGhlIHJlYWN0IGZpYmVyIHRpbWUgdG8gYmUgZnVsbHkgcmVjb25jaWxlZFxuICAgIHRyeSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgYnVpbGRBbmRTZW5kTmF2VHJlZShwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgICAgICB1cGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgICAgfSwgMzAwKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFUlJPUjogQ291bGQgbm90IHJlLWNyZWF0ZSBuYXYgdHJlZSBvbiBET00gY2hhbmdlLCAnICsgZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IG9uRE9NQ2hhbmdlZCA9IChcbiAgICBtdXRhdGlvbnM6IGFueVtdLFxuICAgIHBhcmVudFBvcnQ6IGFueSxcbiAgICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcblxuICAgIC8vIElmIHNldCB0byB0cnVlIHRoaXMgaXMgY2FsbGVkIGZyb20gdGhlIHNoYWRvdyByb290IGZvciB0aGUgbmV4dGpzIGJ1aWxkIHdhdGNoZXIgKHRoZSBzcGlubmluZyB0cmlhbmdsZSlcbiAgICBmcm9tTmV4dEpzTG9hZGVyPzogYm9vbGVhbixcbiAgKSA9PiB7XG4gICAgLy8gVWRwYXRlIHRoZSBocmVmIGluIHRoZSBwYXJlbnQgY29udGFpbmVyXG4gICAgaWYgKGdldE1lbW9yeVN0b3JhZ2VJdGVtKCdocmVmJykgIT09IHdpbmRvdy5sb2NhdGlvbi5ocmVmKSB7XG4gICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5MQVRFU1RfSFJFRixcbiAgICAgICAgaHJlZjogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICB9KTtcbiAgICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKCdocmVmJywgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHdlIHNob3VsZCByZWZyZXNoIHRoZSBuYXYgdHJlZVxuICAgIGxldCByZWZyZXNoTmF2VHJlZSA9IGZhbHNlO1xuICAgIGlmIChmcm9tTmV4dEpzTG9hZGVyKSB7XG4gICAgICAvLyBGcm9tIHRoZSBuZXh0anMgbG9hZGVyLCByZWZyZXNoIHdoZW4gdGhlIGxvYWRlciBnZXRzIGhpZGRlbiAobWVhbnMgcmVmcmVzaCBpcyBkb25lKVxuICAgICAgY29uc3QgbXV0YXRpb25UYXJnZXQgPSBtdXRhdGlvbnM/LlswXT8udGFyZ2V0O1xuICAgICAgaWYgKG11dGF0aW9uVGFyZ2V0ICYmIG11dGF0aW9uVGFyZ2V0LmlkID09PSAnY29udGFpbmVyJykge1xuICAgICAgICBjb25zdCBjdXJyZW50bHlIb3RSZWxvYWRpbmcgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShIT1RfUkVMT0FESU5HKTtcblxuICAgICAgICBpZiAobXV0YXRpb25UYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCd2aXNpYmxlJykpIHtcbiAgICAgICAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShIT1RfUkVMT0FESU5HLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShIT1RfUkVMT0FESU5HLCBmYWxzZSk7XG4gICAgICAgICAgcmVmcmVzaE5hdlRyZWUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG11dGF0aW9ucy5mb3JFYWNoKChlOiBhbnkpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlIGNsYXNzIGF0dHJpYnV0ZSBoYXMgY2hhbmdlZCBvbiBhbiBlbGVtZW50IHdlIGhhdmUgdG8gcmVwYXJzZSB0aGUgbmF2IHRyZWUgdG8gYWRkIHRoZSBlbGVtZW50IGtleVxuICAgICAgICBpZiAoXG4gICAgICAgICAgZS50eXBlID09PSAnYXR0cmlidXRlcycgJiZcbiAgICAgICAgICBlLmF0dHJpYnV0ZU5hbWUgPT09ICdjbGFzcycgJiZcbiAgICAgICAgICBlLnRhcmdldCAmJlxuICAgICAgICAgICFpc05vZGVPdXRsaW5lKGUudGFyZ2V0KSAmJlxuICAgICAgICAgICFpc01vdmluZ0VsZW1lbnQoZS50YXJnZXQpICYmXG4gICAgICAgICAgLy8gQW5kIG5vdCBhIHNjcmlwdFxuICAgICAgICAgIC8vIEJ1ZyBmb3VuZCBvbiBPY3QgOCwgMjAyNCwgZm9yIHNvbWUgcmVhc29uIHRoZSBzY3JpcHQga2VwdCB0cmlnZ2VyaW5nIGEgcmVsb2FkXG4gICAgICAgICAgIWUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnc2NyaXB0JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgY29uc3QgZWxlbWVudEtleSA9IGdldEVsZW1lbnRLZXlGcm9tTm9kZShlLnRhcmdldCk7XG4gICAgICAgICAgY29uc3QgdW5pcXVlTG9va3VwID0gZ2V0VW5pcXVlTG9va3VwRnJvbU5vZGUoZS50YXJnZXQpO1xuICAgICAgICAgIC8vIEFuIGVsZW1lbnQgd2hpY2ggZG9lc24ndCBoYXZlIGFuIGVsZW1lbnQga2V5IGhhcyBjaGFuZ2VkXG4gICAgICAgICAgaWYgKCFlbGVtZW50S2V5ICYmICF1bmlxdWVMb29rdXAgJiYgIWlzRWxlbWVudEluU3ZnKGUudGFyZ2V0KSkge1xuICAgICAgICAgICAgcmVmcmVzaE5hdlRyZWUgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIFtlLmFkZGVkTm9kZXMsIGUucmVtb3ZlZE5vZGVzXS5mb3JFYWNoKChub2RlTGlzdCkgPT4ge1xuICAgICAgICAgIGlmICghbm9kZUxpc3QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBub2RlTGlzdC5mb3JFYWNoKChub2RlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICghaXNOb2RlT3V0bGluZShub2RlKSAmJiAhaXNNb3ZpbmdFbGVtZW50KG5vZGUpKSB7XG4gICAgICAgICAgICAgIHJlZnJlc2hOYXZUcmVlID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXJlZnJlc2hOYXZUcmVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSW4gdGhlc2UgY2FzZXMgd2UgZG9uJ3Qgd2FudCB0byB0cmlnZ2VyIGEgbmF2IHRyZWUgcmVmcmVzaCByaWdodCBhd2F5XG4gICAgLy8gc2luY2UgdGhlIGhvdCByZWxvYWQgbWF5IG5vdCBoYXZlIGhhcHBlbmVkIHlldC4gU28gd2Ugc2V0IGEgdGltZW91dCBhbmQgb25seVxuICAgIC8vIHRyaWdnZXIgYSBuYXYgdHJlZSByZWZyZXNoIGlmIGFub3RoZXIgb25lIGhhc24ndCBoYXBwZW5lZCBpbiBiZXR3ZWVuXG4gICAgaWYgKGZyb21OZXh0SnNMb2FkZXIpIHtcbiAgICAgIGNvbnN0IHRyaWdnZXJUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjb25zdCBsYXN0UmVmcmVzaFRpbWUgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShcbiAgICAgICAgICBMQVNUX05BVl9UUkVFX1JFRlJFU0hfVElNRSxcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBEb24ndCByZS1jbGVhciBhbmQgc2VuZCBpZiBhbm90aGVyIHJlZnJlc2ggaGFzIGhhcHBlbmVkIGluIHRoZSBtZWFudGltZVxuICAgICAgICBpZiAoIWxhc3RSZWZyZXNoVGltZSB8fCBsYXN0UmVmcmVzaFRpbWUgPCB0cmlnZ2VyVGltZSkge1xuICAgICAgICAgIGNsZWFySW5zdGFudFVwZGF0ZXNBbmRTZW5kTmF2VHJlZShwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgICAgICB9XG4gICAgICB9LCAxMDAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjbGVhckluc3RhbnRVcGRhdGVzQW5kU2VuZE5hdlRyZWUocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgfTtcblxuICBjb25zdCBvbldoZWVsID0gKGU6IGFueSwgcGFyZW50UG9ydDogYW55LCBzdG9yeWJvYXJkSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHBhc3NlZFRocm91Z2ggPSBwYXNzVGhyb3VnaEV2ZW50c0lmTmVlZGVkKFxuICAgICAgZSxcbiAgICAgIHBhcmVudFBvcnQsXG4gICAgICBzdG9yeWJvYXJkSWQsXG4gICAgKTtcblxuICAgIGNvbnN0IGlzU2Nyb2xsU2hvcnRjdXQgPSBlLmFsdEtleTtcbiAgICBjb25zdCBpc1pvb21TaG9ydGN1dCA9IGUuY3RybEtleSB8fCBlLm1ldGFLZXk7XG5cbiAgICAvLyBJZiB0aGUgdXNlciB3YW50cyB0byBzY3JvbGwgKGVpdGhlciBieSBiZWluZyBpbiBkcml2ZSBtb2RlLCBvciBieSBob2xkaW5nIGFsdClcbiAgICAvLyBhbmQgdGhleSBhcmVuJ3QgdHJ5aW5nIHRvIHpvb20sIGZhbGxiYWNrIHRvIGRlZmF1bHQgYmVoYXZpb3VyLlxuICAgIGlmICghaXNab29tU2hvcnRjdXQgJiYgKHBhc3NlZFRocm91Z2ggfHwgaXNTY3JvbGxTaG9ydGN1dCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIGNvbnN0IGltcG9ydGFudEZpZWxkcyA9IHtcbiAgICAgIGRlbHRhWDogZS5kZWx0YVgsXG4gICAgICBkZWx0YVk6IGUuZGVsdGFZLFxuICAgICAgd2hlZWxEZWx0YTogZS53aGVlbERlbHRhLFxuICAgICAgeDogZS54LFxuICAgICAgeTogZS55LFxuICAgICAgYWx0S2V5OiBlLmFsdEtleSxcbiAgICAgIGN0cmxLZXk6IGUuY3RybEtleSxcbiAgICAgIHNoaWZ0S2V5OiBlLnNoaWZ0S2V5LFxuICAgICAgbWV0YUtleTogZS5tZXRhS2V5LFxuICAgIH07XG5cbiAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuV0hFRUxfRVZFTlQsXG4gICAgICBldmVudDogaW1wb3J0YW50RmllbGRzLFxuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IGFjdGl2ZUVsZW1lbnRNZXRhZGF0YSA9ICgpID0+IHtcbiAgICBjb25zdCBhY3RpdmVFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICBsZXQgdGFnTmFtZSwgaXNDb250ZW50RWRpdGFibGUsIGVsZW1lbnRUeXBlO1xuXG4gICAgaWYgKGFjdGl2ZUVsZW1lbnQpIHtcbiAgICAgIHRhZ05hbWUgPSBhY3RpdmVFbGVtZW50LnRhZ05hbWU7XG5cbiAgICAgIGlmIChhY3RpdmVFbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgaXNDb250ZW50RWRpdGFibGUgPSBhY3RpdmVFbGVtZW50LmlzQ29udGVudEVkaXRhYmxlO1xuICAgICAgfVxuXG4gICAgICBpZiAoYWN0aXZlRWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudFR5cGUgPSBhY3RpdmVFbGVtZW50LnR5cGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICBpc0NvbnRlbnRFZGl0YWJsZTogaXNDb250ZW50RWRpdGFibGUsXG4gICAgICBlbGVtZW50VHlwZTogZWxlbWVudFR5cGUsXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBvbktleURvd24gPSAoZTogYW55LCBwYXJlbnRQb3J0OiBhbnkpID0+IHtcbiAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuS0VZX0RPV05fRVZFTlQsXG4gICAgICBldmVudDoge1xuICAgICAgICBrZXk6IGUua2V5LFxuICAgICAgICBtZXRhS2V5OiBlLm1ldGFLZXksXG4gICAgICAgIHNoaWZ0S2V5OiBlLnNoaWZ0S2V5LFxuICAgICAgICBjdHJsS2V5OiBlLmN0cmxLZXksXG4gICAgICAgIGFjdGl2ZUVsZW1lbnQ6IHtcbiAgICAgICAgICAuLi5hY3RpdmVFbGVtZW50TWV0YWRhdGEoKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3Qgb25LZXlVcCA9IChlOiBhbnksIHBhcmVudFBvcnQ6IGFueSkgPT4ge1xuICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5LRVlfVVBfRVZFTlQsXG4gICAgICBldmVudDoge1xuICAgICAgICBrZXk6IGUua2V5LFxuICAgICAgICBtZXRhS2V5OiBlLm1ldGFLZXksXG4gICAgICAgIHNoaWZ0S2V5OiBlLnNoaWZ0S2V5LFxuICAgICAgICBjdHJsS2V5OiBlLmN0cmxLZXksXG4gICAgICAgIGFjdGl2ZUVsZW1lbnQ6IHtcbiAgICAgICAgICAuLi5hY3RpdmVFbGVtZW50TWV0YWRhdGEoKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgdGhyb3R0bGVkVXBkYXRlT3V0bGluZXMgPSBfLnRocm90dGxlKFxuICAgIChwYXJlbnRQb3J0OiBhbnksIHN0b3J5Ym9hcmRJZDogc3RyaW5nKSA9PlxuICAgICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKSxcbiAgICAxNSxcbiAgKTtcblxuICBjb25zdCBvblNjcm9sbCA9IChlOiBhbnksIHBhcmVudFBvcnQ6IGFueSwgc3Rvcnlib2FyZElkOiBzdHJpbmcpID0+IHtcbiAgICB0aHJvdHRsZWRVcGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICB9O1xuXG4gIC8vIE5lZWQgdG8gcmVnaXN0ZXIgZnVuY3Rpb25zIG9uIHRoZSB3aW5kb3cgZm9yIGNoYW5uZWwgbWVzc2FnaW5nIHRvIHVzZSB0aGVtXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LmluaXRQcm9qZWN0ID0gKFxuICAgIHBhcmVudFBvcnQ6IGFueSxcbiAgICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDoge30sXG4gICAgc2NvcGVMb29rdXA6IHt9LFxuICAgIHN0b3J5Ym9hcmRDb21wb25lbnRFbGVtZW50PzogYW55LFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIGRyaXZlTW9kZUVuYWJsZWQ/OiBib29sZWFuO1xuICAgICAgYWlDb250ZXh0U2VsZWN0aW9uPzogYm9vbGVhbjtcbiAgICB9ID0ge30sXG4gICAgc3Rvcnlib2FyZFR5cGU/OiBzdHJpbmcsXG4gICAgc2F2ZWRDb21wb25lbnRGaWxlbmFtZT86IHN0cmluZyxcbiAgICBvcmlnaW5hbFN0b3J5Ym9hcmRVcmw/OiBzdHJpbmcsXG4gICkgPT4ge1xuICAgIGNvbnN0IHBhc3NpdmU6IGFueSA9IG1ha2VQYXNzaXZlRXZlbnRPcHRpb24oKTtcbiAgICBwYXNzaXZlWydjYXB0dXJlJ10gPSB0cnVlO1xuXG4gICAgY29uc3QgYm9keSQgPSAkKCdib2R5Jyk7XG5cbiAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShUUkVFX0VMRU1FTlRfTE9PS1VQLCB0cmVlRWxlbWVudExvb2t1cCk7XG4gICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0NPUEVfTE9PS1VQLCBzY29wZUxvb2t1cCk7XG5cbiAgICBpZiAoc3Rvcnlib2FyZENvbXBvbmVudEVsZW1lbnQpIHtcbiAgICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKFNUT1JZQk9BUkRfQ09NUE9ORU5ULCBzdG9yeWJvYXJkQ29tcG9uZW50RWxlbWVudCk7XG4gICAgfVxuXG4gICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oU1RPUllCT0FSRF9UWVBFLCBzdG9yeWJvYXJkVHlwZSk7XG5cbiAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShcbiAgICAgIFNBVkVEX1NUT1JZQk9BUkRfQ09NUE9ORU5UX0ZJTEVOQU1FLFxuICAgICAgc2F2ZWRDb21wb25lbnRGaWxlbmFtZSxcbiAgICApO1xuXG4gICAgLy8gVGhlIFVSTCB0aGF0IHdhcyBvcmlnaW5hbGx5IGxvYWRlZCBmb3IgdGhpcyBzdG9yeWJvYXJkLCBpdCBtYXkgYmUgZGlmZmVyZW50IGZyb20gaHJlZlxuICAgIC8vIGlmIHRoZSB1c2VyIG5hdmlnYXRlZCBhd2F5IHRvIGEgbmV3IHJvdXRlXG4gICAgaWYgKG9yaWdpbmFsU3Rvcnlib2FyZFVybCkge1xuICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oT1JJR0lOQUxfU1RPUllCT0FSRF9VUkwsIG9yaWdpbmFsU3Rvcnlib2FyZFVybCk7XG4gICAgfVxuXG4gICAgLy8gQ2xlYXIgaWZyYW1lIG91dGxpbmVzXG4gICAgcmVtb3ZlTWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVkpO1xuICAgIHJlbW92ZU1lbW9yeVN0b3JhZ2VJdGVtKEhPVkVSRURfRUxFTUVOVF9LRVkpO1xuICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG5cbiAgICAvLyBSZWdpc3RlciBldmVudCBsaXN0ZW5lcnNcbiAgICBjb25zdCBib2R5T2JqZWN0ID0gYm9keSQuZ2V0KDApO1xuICAgIGJvZHlPYmplY3Q/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAnY2xpY2snLFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBwYXNzVGhyb3VnaEV2ZW50c0lmTmVlZGVkKGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9LFxuICAgICAgcGFzc2l2ZSxcbiAgICApO1xuICAgIGJvZHlPYmplY3Q/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAncG9pbnRlcm92ZXInLFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBvblBvaW50ZXJPdmVyKGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9LFxuICAgICAgcGFzc2l2ZSxcbiAgICApO1xuICAgIGJvZHlPYmplY3Q/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAncG9pbnRlcmRvd24nLFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBvblBvaW50ZXJEb3duKGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9LFxuICAgICAgcGFzc2l2ZSxcbiAgICApO1xuICAgIGJvZHlPYmplY3Q/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAncG9pbnRlcnVwJyxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgb25Qb2ludGVyVXAoZSwgcGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICAgIH0sXG4gICAgICBwYXNzaXZlLFxuICAgICk7XG4gICAgYm9keU9iamVjdD8uYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICdwb2ludGVybW92ZScsXG4gICAgICAoZTogYW55KSA9PiB7XG4gICAgICAgIG9uUG9pbnRlck1vdmUoZSwgcGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICAgIH0sXG4gICAgICBwYXNzaXZlLFxuICAgICk7XG4gICAgYm9keU9iamVjdD8uYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICdwb2ludGVybGVhdmUnLFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBwYXNzVGhyb3VnaEV2ZW50c0lmTmVlZGVkKGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9LFxuICAgICAgcGFzc2l2ZSxcbiAgICApO1xuICAgIGJvZHlPYmplY3Q/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAnY29udGV4dG1lbnUnLFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBvbkNsaWNrRWxlbWVudENvbnRleHRNZW51KGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9LFxuICAgICAgcGFzc2l2ZSxcbiAgICApO1xuICAgIGJvZHlPYmplY3Q/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAnZGJsY2xpY2snLFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBwYXNzVGhyb3VnaEV2ZW50c0lmTmVlZGVkKGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9LFxuICAgICAgcGFzc2l2ZSxcbiAgICApO1xuXG4gICAgYm9keU9iamVjdD8uYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICdtb3VzZW92ZXInLFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBwYXNzVGhyb3VnaEV2ZW50c0lmTmVlZGVkKGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9LFxuICAgICAgcGFzc2l2ZSxcbiAgICApO1xuICAgIGJvZHlPYmplY3Q/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAnbW91c2VvdXQnLFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBwYXNzVGhyb3VnaEV2ZW50c0lmTmVlZGVkKGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB9LFxuICAgICAgcGFzc2l2ZSxcbiAgICApO1xuICAgIGJvZHlPYmplY3Q/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAnbW91c2Vtb3ZlJyxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgcGFzc1Rocm91Z2hFdmVudHNJZk5lZWRlZChlLCBwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgICAgfSxcbiAgICAgIHBhc3NpdmUsXG4gICAgKTtcbiAgICBib2R5T2JqZWN0Py5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgJ21vdXNlZG93bicsXG4gICAgICAoZTogYW55KSA9PiB7XG4gICAgICAgIHBhc3NUaHJvdWdoRXZlbnRzSWZOZWVkZWQoZSwgcGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICAgIH0sXG4gICAgICBwYXNzaXZlLFxuICAgICk7XG4gICAgYm9keU9iamVjdD8uYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICdtb3VzZXVwJyxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgcGFzc1Rocm91Z2hFdmVudHNJZk5lZWRlZChlLCBwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgICAgfSxcbiAgICAgIHBhc3NpdmUsXG4gICAgKTtcbiAgICBib2R5T2JqZWN0Py5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgJ3doZWVsJyxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgb25XaGVlbChlLCBwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgICAgfSxcbiAgICAgIHBhc3NpdmUsXG4gICAgKTtcblxuICAgIGJvZHlPYmplY3Q/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAna2V5ZG93bicsXG4gICAgICAoZTogYW55KSA9PiB7XG4gICAgICAgIG9uS2V5RG93bihlLCBwYXJlbnRQb3J0KTtcbiAgICAgIH0sXG4gICAgICBwYXNzaXZlLFxuICAgICk7XG5cbiAgICBib2R5T2JqZWN0Py5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgJ2tleXVwJyxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgb25LZXlVcChlLCBwYXJlbnRQb3J0KTtcbiAgICAgIH0sXG4gICAgICBwYXNzaXZlLFxuICAgICk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICdzY3JvbGwnLFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBvblNjcm9sbChlLCBwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgICAgfSxcbiAgICAgIHBhc3NpdmUsXG4gICAgKTtcblxuICAgIC8vIEhhY2s6IHRoaXMgaXMgdXNlZCB0b1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAncG9pbnRlcmxvY2tjaGFuZ2UnLFxuICAgICAgKCkgPT4ge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50ICYmXG4gICAgICAgICAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oSU1NRURJQVRFTFlfUkVNT1ZFX1BPSU5URVJfTE9DSylcbiAgICAgICAgKSB7XG4gICAgICAgICAgZG9jdW1lbnQuZXhpdFBvaW50ZXJMb2NrKCk7XG4gICAgICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oSU1NRURJQVRFTFlfUkVNT1ZFX1BPSU5URVJfTE9DSywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmFsc2UsXG4gICAgKTtcblxuICAgIG9ic2VydmVET00oYm9keU9iamVjdCwgKGU6IGFueSkgPT4ge1xuICAgICAgb25ET01DaGFuZ2VkKGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgfSk7XG5cbiAgICAvLyBJZiB0aGlzIGlzIE5leHRKUywgYWxzbyBsaXN0ZW4gdG8gdGhlIHNoYWRvdyByb290IG9mIHRoZSBfX25leHQtYnVpbGQtd2F0Y2hlclxuICAgIC8vIFRoaXMgdHJpZ2dlcmVzIHRoZSBvbkRPTUNoYW5nZWQgd2hlbiB0aGUgaG90IHJlbG9hZCBzeW1ib2wgc2hvd3MgdXBcbiAgICBjb25zdCBuZXh0QnVpbGRXYXRjaGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ19fbmV4dC1idWlsZC13YXRjaGVyJyk7XG4gICAgaWYgKG5leHRCdWlsZFdhdGNoZXIgJiYgbmV4dEJ1aWxkV2F0Y2hlci5zaGFkb3dSb290KSB7XG4gICAgICBBcnJheS5mcm9tKG5leHRCdWlsZFdhdGNoZXIuc2hhZG93Um9vdC5jaGlsZHJlbikuZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4ge1xuICAgICAgICBvYnNlcnZlRE9NKGNoaWxkLCAoZTogYW55KSA9PiB7XG4gICAgICAgICAgb25ET01DaGFuZ2VkKGUsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZHJpdmVNb2RlRW5hYmxlZCkge1xuICAgICAgZW5hYmxlRHJpdmVNb2RlKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRpc2FibGVEcml2ZU1vZGUocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5haUNvbnRleHRTZWxlY3Rpb24pIHtcbiAgICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKCdhaUNvbnRleHQnLCB0cnVlKTtcbiAgICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKCdhaUNvbnRleHQnLCBmYWxzZSk7XG4gICAgICB1cGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgIH1cblxuICAgIC8vIEJ1aWxkIHRoZSBOYXYgVHJlZSBhbmQgc2VuZCBpdCBiYWNrXG4gICAgdHJ5IHtcbiAgICAgIGJ1aWxkQW5kU2VuZE5hdlRyZWUoXG4gICAgICAgIHBhcmVudFBvcnQsXG4gICAgICAgIHN0b3J5Ym9hcmRJZCxcbiAgICAgICAgdHJlZUVsZW1lbnRMb29rdXAsXG4gICAgICAgIHNjb3BlTG9va3VwLFxuICAgICAgICBzdG9yeWJvYXJkQ29tcG9uZW50RWxlbWVudCB8fCAnRVhQTElDSVRfTk9ORScsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgYnVpbGRpbmcgbmF2IHRyZWU6ICcgKyBlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgZW5hYmxlRHJpdmVNb2RlID0gKHBhcmVudFBvcnQ6IGFueSwgc3Rvcnlib2FyZElkOiBzdHJpbmcpID0+IHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKCFnZXRTZXNzaW9uU3RvcmFnZUl0ZW0oJ2RyaXZlTW9kZUVuYWJsZWQnLCBzdG9yeWJvYXJkSWQpKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBzZXRTZXNzaW9uU3RvcmFnZUl0ZW0oJ2RyaXZlTW9kZUVuYWJsZWQnLCAnZW5hYmxlZCcsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICBjbGVhckhvdmVyZWRFbGVtZW50cyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgICAgY2xlYXJBbGxPdXRsaW5lcygpO1xuICAgIH1cblxuICAgICQoJ2JvZHknKS5jc3MoJ2N1cnNvcicsICcnKTtcbiAgfTtcblxuICBjb25zdCBkaXNhYmxlRHJpdmVNb2RlID0gKHBhcmVudFBvcnQ6IGFueSwgc3Rvcnlib2FyZElkOiBzdHJpbmcpID0+IHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKGdldFNlc3Npb25TdG9yYWdlSXRlbSgnZHJpdmVNb2RlRW5hYmxlZCcsIHN0b3J5Ym9hcmRJZCkpIHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHJlbW92ZVNlc3Npb25TdG9yYWdlSXRlbSgnZHJpdmVNb2RlRW5hYmxlZCcsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICB1cGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgICAgY2xlYXJIb3ZlcmVkRWxlbWVudHMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICB9XG5cbiAgICAkKCdib2R5JykuYXR0cignc3R5bGUnLCBmdW5jdGlvbiAoaSwgcykge1xuICAgICAgcmV0dXJuIChzIHx8ICcnKSArICdjdXJzb3I6IGRlZmF1bHQgIWltcG9ydGFudDsnO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LmVuYWJsZURyaXZlTW9kZSA9IChwYXJlbnRQb3J0OiBhbnksIHN0b3J5Ym9hcmRJZDogc3RyaW5nKSA9PiB7XG4gICAgZW5hYmxlRHJpdmVNb2RlKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuZGlzYWJsZURyaXZlTW9kZSA9IChwYXJlbnRQb3J0OiBhbnksIHN0b3J5Ym9hcmRJZDogc3RyaW5nKSA9PiB7XG4gICAgZGlzYWJsZURyaXZlTW9kZShwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LnNldE5ld0xvb2t1cHMgPSAoXG4gICAgcGFyZW50UG9ydDogYW55LFxuICAgIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuICAgIHRyZWVFbGVtZW50TG9va3VwOiBhbnksXG4gICAgc2NvcGVMb29rdXA6IGFueSxcbiAgKSA9PiB7XG4gICAgY29uc3QgcHJldlRyZWVFbGVtbnRMb29rdXAgPVxuICAgICAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oVFJFRV9FTEVNRU5UX0xPT0tVUCkgfHwge307XG5cbiAgICBjb25zdCBwcmV2U2NvcGVMb29rdXAgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShTQ09QRV9MT09LVVApIHx8IHt9O1xuXG4gICAgY29uc3QgbmV3VHJlZUVsZW1lbnRzOiBhbnkgPSB7XG4gICAgICAuLi5wcmV2VHJlZUVsZW1udExvb2t1cCxcbiAgICB9O1xuXG4gICAgLy8gRGVsZXRlIGFueSB0cmVlIGVsZW1lbnRzIHRoYXQgd2VyZSBzZXQgdG8gbnVsXG4gICAgT2JqZWN0LmtleXModHJlZUVsZW1lbnRMb29rdXApLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAodHJlZUVsZW1lbnRMb29rdXBba2V5XSkge1xuICAgICAgICBuZXdUcmVlRWxlbWVudHNba2V5XSA9IHRyZWVFbGVtZW50TG9va3VwW2tleV07XG4gICAgICB9IGVsc2UgaWYgKG5ld1RyZWVFbGVtZW50c1trZXldKSB7XG4gICAgICAgIGRlbGV0ZSBuZXdUcmVlRWxlbWVudHNba2V5XTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IG5ld1Njb3BlczogYW55ID0ge1xuICAgICAgLi4ucHJldlNjb3BlTG9va3VwLFxuICAgIH07XG5cbiAgICAvLyBEZWxldGUgYW55IHNjb3BlcyB0aGF0IHdlcmUgc2V0IHRvIG51bFxuICAgIE9iamVjdC5rZXlzKHNjb3BlTG9va3VwKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKHNjb3BlTG9va3VwW2tleV0pIHtcbiAgICAgICAgbmV3U2NvcGVzW2tleV0gPSBzY29wZUxvb2t1cFtrZXldO1xuICAgICAgfSBlbHNlIGlmIChuZXdTY29wZXNba2V5XSkge1xuICAgICAgICBkZWxldGUgbmV3U2NvcGVzW2tleV07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShUUkVFX0VMRU1FTlRfTE9PS1VQLCBuZXdUcmVlRWxlbWVudHMpO1xuICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKFNDT1BFX0xPT0tVUCwgbmV3U2NvcGVzKTtcbiAgfTtcblxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy5zZXRIb3ZlcmVkRWxlbWVudCA9IChcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgZWxlbWVudEtleTogc3RyaW5nLFxuICApID0+IHtcbiAgICBjb25zdCBkcml2ZU1vZGVFbmFibGVkID0gISFnZXRTZXNzaW9uU3RvcmFnZUl0ZW0oXG4gICAgICAnZHJpdmVNb2RlRW5hYmxlZCcsXG4gICAgICBzdG9yeWJvYXJkSWQsXG4gICAgKTtcbiAgICBpZiAoZHJpdmVNb2RlRW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZIb3ZlcmVkRWxlbWVudEtleSA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKEhPVkVSRURfRUxFTUVOVF9LRVkpO1xuICAgIGlmIChwcmV2SG92ZXJlZEVsZW1lbnRLZXkgPT09IGVsZW1lbnRLZXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZWxlbWVudEtleSkge1xuICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oSE9WRVJFRF9FTEVNRU5UX0tFWSwgZWxlbWVudEtleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZU1lbW9yeVN0b3JhZ2VJdGVtKEhPVkVSRURfRUxFTUVOVF9LRVkpO1xuICAgIH1cblxuICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuc2V0U2VsZWN0ZWRFbGVtZW50ID0gKFxuICAgIHBhcmVudFBvcnQ6IGFueSxcbiAgICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbiAgICBlbGVtZW50S2V5OiBzdHJpbmcsXG4gICkgPT4ge1xuICAgIGNvbnN0IHByZXZTZWxlY3RlZEVsZW1lbnRLZXkgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShTRUxFQ1RFRF9FTEVNRU5UX0tFWSk7XG4gICAgaWYgKHByZXZTZWxlY3RlZEVsZW1lbnRLZXkgPT09IGVsZW1lbnRLZXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZWxlbWVudEtleSkge1xuICAgICAgY29uc3QgdGVtcG9FbGVtZW50ID0gVGVtcG9FbGVtZW50LmZyb21LZXkoZWxlbWVudEtleSk7XG4gICAgICBsZXQgZWxlbWVudEtleVRvRXh0cmFjdCA9IGVsZW1lbnRLZXk7XG5cbiAgICAgIGlmICh0ZW1wb0VsZW1lbnQuaXNTdG9yeWJvYXJkKHN0b3J5Ym9hcmRJZCkpIHtcbiAgICAgICAgLy8gUGFzcyBiYWNrIHRoZSBvdXRlckhUTUwgb2YgdGhlIHRvcCBsZXZlbCBub2RlXG4gICAgICAgIGNvbnN0IHRvcExldmVsTm9kZTogTmF2VHJlZU5vZGUgPVxuICAgICAgICAgIGdldE1lbW9yeVN0b3JhZ2VJdGVtKENVUlJFTlRfTkFWX1RSRUUpO1xuICAgICAgICBjb25zdCB0b3BMZXZlbEVsZW1lbnRLZXkgPSB0b3BMZXZlbE5vZGU/LnRlbXBvRWxlbWVudD8uZ2V0S2V5KCk7XG4gICAgICAgIGlmICh0b3BMZXZlbEVsZW1lbnRLZXkpIHtcbiAgICAgICAgICBlbGVtZW50S2V5VG9FeHRyYWN0ID0gdG9wTGV2ZWxFbGVtZW50S2V5O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFNlbmQgYmFjayB0aGUgbWVzc2FnZSBqdXN0IHRvIHNldCB0aGUgb3V0ZXJIVE1MIG9ubHlcbiAgICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLlNFTEVDVEVEX0VMRU1FTlRfS0VZLFxuICAgICAgICBkb05vdFNldEVsZW1lbnRLZXk6IHRydWUsXG4gICAgICAgIG91dGVySFRNTDogJChgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7ZWxlbWVudEtleVRvRXh0cmFjdH1gKS5nZXQoMClcbiAgICAgICAgICA/Lm91dGVySFRNTCxcbiAgICAgIH0pO1xuICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVksIGVsZW1lbnRLZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5TRUxFQ1RFRF9FTEVNRU5UX0tFWSxcbiAgICAgICAgZG9Ob3RTZXRFbGVtZW50S2V5OiB0cnVlLFxuICAgICAgICBvdXRlckhUTUw6IG51bGwsXG4gICAgICB9KTtcbiAgICAgIHJlbW92ZU1lbW9yeVN0b3JhZ2VJdGVtKFNFTEVDVEVEX0VMRU1FTlRfS0VZKTtcbiAgICB9XG5cbiAgICB1cGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LnNldE11bHRpc2VsZWN0ZWRFbGVtZW50S2V5cyA9IChcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgZWxlbWVudEtleXM6IHN0cmluZ1tdLFxuICApID0+IHtcbiAgICBjb25zdCBwcmV2TXVsdGlTZWxlY3RlZEVsZW1lbnRLZXlzID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oXG4gICAgICBNVUxUSV9TRUxFQ1RFRF9FTEVNRU5UX0tFWVMsXG4gICAgKTtcbiAgICBjb25zdCBwcmV2U2V0ID0gbmV3IFNldChwcmV2TXVsdGlTZWxlY3RlZEVsZW1lbnRLZXlzIHx8IFtdKTtcbiAgICBjb25zdCBuZXdTZXQgPSBuZXcgU2V0KGVsZW1lbnRLZXlzIHx8IFtdKTtcbiAgICBjb25zdCBzZXRzRXF1YWwgPVxuICAgICAgcHJldlNldC5zaXplID09PSBuZXdTZXQuc2l6ZSAmJlxuICAgICAgWy4uLnByZXZTZXRdLmV2ZXJ5KCh2YWx1ZTogYW55KSA9PiBuZXdTZXQuaGFzKHZhbHVlKSk7XG4gICAgaWYgKHNldHNFcXVhbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChlbGVtZW50S2V5cykge1xuICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oTVVMVElfU0VMRUNURURfRUxFTUVOVF9LRVlTLCBlbGVtZW50S2V5cyk7XG4gICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5NVUxUSV9TRUxFQ1RFRF9FTEVNRU5UX0tFWVMsXG4gICAgICAgIGRvTm90U2V0RWxlbWVudEtleXM6IHRydWUsXG4gICAgICAgIG91dGVySFRNTHM6IGVsZW1lbnRLZXlzPy5tYXAoXG4gICAgICAgICAgKGVsZW1lbnRLZXkpID0+XG4gICAgICAgICAgICAkKGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtlbGVtZW50S2V5fWApLmdldCgwKT8ub3V0ZXJIVE1MLFxuICAgICAgICApLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZU1lbW9yeVN0b3JhZ2VJdGVtKE1VTFRJX1NFTEVDVEVEX0VMRU1FTlRfS0VZUyk7XG4gICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5NVUxUSV9TRUxFQ1RFRF9FTEVNRU5UX0tFWVMsXG4gICAgICAgIGRvTm90U2V0RWxlbWVudEtleXM6IHRydWUsXG4gICAgICAgIG91dGVySFRNTHM6IFtdLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgfTtcblxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy5wcm9jZXNzUnVsZXNGb3JTZWxlY3RlZEVsZW1lbnQgPSAoXG4gICAgcGFyZW50UG9ydDogYW55LFxuICAgIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuICAgIGNzc0VsZW1lbnRMb29rdXA6IHt9LFxuICAgIHNlbGVjdGVkRWxlbWVudEtleTogc3RyaW5nLFxuICApID0+IHtcbiAgICBwcm9jZXNzUnVsZXNGb3JTZWxlY3RlZEVsZW1lbnQoXG4gICAgICBwYXJlbnRQb3J0LFxuICAgICAgY3NzRWxlbWVudExvb2t1cCxcbiAgICAgIHNlbGVjdGVkRWxlbWVudEtleSxcbiAgICApO1xuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LnNldE1vZGlmaWVyc0ZvclNlbGVjdGVkRWxlbWVudCA9IChcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgbW9kaWZpZXJzOiBhbnksXG4gICAgc2VsZWN0ZWRFbGVtZW50S2V5OiBzdHJpbmcsXG4gICkgPT4ge1xuICAgIHNldE1vZGlmaWVyc0ZvclNlbGVjdGVkRWxlbWVudChwYXJlbnRQb3J0LCBtb2RpZmllcnMsIHNlbGVjdGVkRWxlbWVudEtleSk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuZ2V0Q3NzRXZhbHMgPSAoXG4gICAgcGFyZW50UG9ydDogYW55LFxuICAgIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuICAgIHNlbGVjdGVkRWxlbWVudEtleTogc3RyaW5nLFxuICApID0+IHtcbiAgICBnZXRDc3NFdmFscyhwYXJlbnRQb3J0LCBzZWxlY3RlZEVsZW1lbnRLZXkpO1xuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LnJ1bGVNYXRjaGVzRWxlbWVudCA9IChcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgbWVzc2FnZUlkOiBzdHJpbmcsXG4gICAgcnVsZTogc3RyaW5nLFxuICAgIHNlbGVjdGVkRWxlbWVudEtleTogc3RyaW5nLFxuICApID0+IHtcbiAgICBydWxlTWF0Y2hlc0VsZW1lbnQocGFyZW50UG9ydCwgbWVzc2FnZUlkLCBydWxlLCBzZWxlY3RlZEVsZW1lbnRLZXkpO1xuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LmdldEVsZW1lbnRDbGFzc0xpc3QgPSAoXG4gICAgcGFyZW50UG9ydDogYW55LFxuICAgIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuICAgIHNlbGVjdGVkRWxlbWVudEtleTogc3RyaW5nLFxuICApID0+IHtcbiAgICBnZXRFbGVtZW50Q2xhc3NMaXN0KHBhcmVudFBvcnQsIHNlbGVjdGVkRWxlbWVudEtleSk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuYXBwbHlDaGFuZ2VJdGVtVG9Eb2N1bWVudCA9IGFzeW5jIChcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgY2hhbmdlSXRlbTogQW55Q2hhbmdlTGVkZ2VySXRlbSxcbiAgKSA9PiB7XG4gICAgY29uc3QgeyBzZW5kTmV3TmF2VHJlZSB9ID0gYXBwbHlDaGFuZ2VJdGVtVG9Eb2N1bWVudChcbiAgICAgIHBhcmVudFBvcnQsXG4gICAgICBzdG9yeWJvYXJkSWQsXG4gICAgICBjaGFuZ2VJdGVtLFxuICAgICk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIG5hdiB0cmVlICYgb3V0bGluZXNcbiAgICBpZiAoc2VuZE5ld05hdlRyZWUpIHtcbiAgICAgIGJ1aWxkQW5kU2VuZE5hdlRyZWUocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICB9XG4gICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgfTtcblxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy51cGRhdGVDb2RlYmFzZUlkcyA9IChcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgcHJldklkVG9OZXdJZE1hcDogeyBbcHJldkNvZGViYXNlSWQ6IHN0cmluZ106IHN0cmluZyB9LFxuICAgIG5ld1RyZWVFbGVtZW50TG9va3VwOiBhbnksXG4gICAgbmV3U2NvcGVMb29rdXA6IGFueSxcbiAgKSA9PiB7XG4gICAgY29uc3Qgc2VuZE5ld05hdlRyZWUgPSB1cGRhdGVDb2RlYmFzZUlkcyhcbiAgICAgIHBhcmVudFBvcnQsXG4gICAgICBwcmV2SWRUb05ld0lkTWFwLFxuICAgICAgdHJ1ZSxcbiAgICApO1xuXG4gICAgaWYgKHNlbmROZXdOYXZUcmVlKSB7XG4gICAgICBidWlsZEFuZFNlbmROYXZUcmVlKFxuICAgICAgICBwYXJlbnRQb3J0LFxuICAgICAgICBzdG9yeWJvYXJkSWQsXG4gICAgICAgIG5ld1RyZWVFbGVtZW50TG9va3VwLFxuICAgICAgICBuZXdTY29wZUxvb2t1cCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgfTtcblxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy5kaXNwYXRjaEV2ZW50ID0gKFxuICAgIHBhcmVudFBvcnQ6IGFueSxcbiAgICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbiAgICBldmVudE5hbWU6IHN0cmluZyxcbiAgICBldmVudERldGFpbHM6IGFueSxcbiAgKSA9PiB7XG4gICAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lLCB7XG4gICAgICAuLi5ldmVudERldGFpbHMsXG4gICAgfSk7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cudXBkYXRlT3V0bGluZXMgPSAocGFyZW50UG9ydDogYW55LCBzdG9yeWJvYXJkSWQ6IHN0cmluZykgPT4ge1xuICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuZ29CYWNrID0gKHBhcmVudFBvcnQ6IGFueSwgc3Rvcnlib2FyZElkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoZG9jdW1lbnQucmVmZXJyZXIgIT09ICcnKSB7XG4gICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LmdvRm9yd2FyZCA9IChwYXJlbnRQb3J0OiBhbnksIHN0b3J5Ym9hcmRJZDogc3RyaW5nKSA9PiB7XG4gICAgd2luZG93Lmhpc3RvcnkuZm9yd2FyZCgpO1xuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LnJlZnJlc2ggPSAocGFyZW50UG9ydDogYW55LCBzdG9yeWJvYXJkSWQ6IHN0cmluZykgPT4ge1xuICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgfTtcblxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy5zeW50aGV0aWNNb3VzZU92ZXIgPSAoXG4gICAgcGFyZW50UG9ydDogYW55LFxuICAgIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuICAgIGNvb3JkczogYW55LFxuICAgIGRvbnRIb3Zlckluc2lkZVNlbGVjdGVkOiBib29sZWFuLFxuICAgIHNlbGVjdEJvdHRvbU1vc3RFbGVtZW50OiBib29sZWFuLFxuICApID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGNvb3Jkcy54LCBjb29yZHMueSk7XG5cbiAgICAvLyBJZiB0aGlzIGlzIHRydWUgd2UgZG9uJ3Qgd2FudCB0byB0cmlnZ2VyIGEgaG92ZXIgZXZlbnQgaW5zaWRlIGEgc2VsZWN0ZWQgZWxlbWVudCwgaW5zdGVhZCBqdXN0IHNldCBob3ZlcmluZyBvbiB0aGUgc2VsZWN0ZWQgZWxlbWVudFxuICAgIGlmIChkb250SG92ZXJJbnNpZGVTZWxlY3RlZCkge1xuICAgICAgY29uc3Qgc2VsZWN0ZWRFbGVtZW50S2V5ID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVkpO1xuICAgICAgY29uc3Qgc2VsZWN0ZWRFbGVtZW50ID0gVGVtcG9FbGVtZW50LmZyb21LZXkoc2VsZWN0ZWRFbGVtZW50S2V5KTtcblxuICAgICAgaWYgKCFzZWxlY3RlZEVsZW1lbnQuaXNFbXB0eSgpKSB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkRG9tRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgYC4ke0VMRU1FTlRfS0VZX1BSRUZJWH0ke3NlbGVjdGVkRWxlbWVudEtleX1gLFxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChzZWxlY3RlZERvbUVsZW1lbnQ/LmNvbnRhaW5zKHRhcmdldCkpIHtcbiAgICAgICAgICBvblBvaW50ZXJPdmVyKFxuICAgICAgICAgICAgeyB0YXJnZXQ6IHNlbGVjdGVkRG9tRWxlbWVudCB9LFxuICAgICAgICAgICAgcGFyZW50UG9ydCxcbiAgICAgICAgICAgIHN0b3J5Ym9hcmRJZCxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIG9uUG9pbnRlck92ZXIoXG4gICAgICB7IHRhcmdldCB9LFxuICAgICAgcGFyZW50UG9ydCxcbiAgICAgIHN0b3J5Ym9hcmRJZCxcbiAgICAgIHNlbGVjdEJvdHRvbU1vc3RFbGVtZW50LFxuICAgICk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuc3ludGhldGljTW91c2VNb3ZlID0gKFxuICAgIHBhcmVudFBvcnQ6IGFueSxcbiAgICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbiAgICBzeW50aGV0aWNFdmVudDoge1xuICAgICAgY2xpZW50WDogbnVtYmVyO1xuICAgICAgY2xpZW50WTogbnVtYmVyO1xuICAgICAgYnV0dG9ucz86IG51bWJlcjtcbiAgICB9LFxuICApID0+IHtcbiAgICBjb25zdCBldmVudFdpdGhDbGllbnQgPSB7XG4gICAgICAuLi5zeW50aGV0aWNFdmVudCxcbiAgICAgIHBhZ2VYOlxuICAgICAgICBzeW50aGV0aWNFdmVudC5jbGllbnRYICtcbiAgICAgICAgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCksXG4gICAgICBwYWdlWTpcbiAgICAgICAgc3ludGhldGljRXZlbnQuY2xpZW50WSArXG4gICAgICAgIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKSxcbiAgICB9O1xuXG4gICAgb25Qb2ludGVyTW92ZShldmVudFdpdGhDbGllbnQsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuc3ludGhldGljTW91c2VVcCA9IChcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgc3ludGhldGljRXZlbnQ6IGFueSxcbiAgKSA9PiB7XG4gICAgb25Qb2ludGVyVXAoc3ludGhldGljRXZlbnQsIHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuY2xlYXJIb3ZlcmVkT3V0bGluZXMgPSAocGFyZW50UG9ydDogYW55LCBzdG9yeWJvYXJkSWQ6IHN0cmluZykgPT4ge1xuICAgIGlmIChnZXRNZW1vcnlTdG9yYWdlSXRlbShIT1ZFUkVEX0VMRU1FTlRfS0VZKSkge1xuICAgICAgY2xlYXJIb3ZlcmVkRWxlbWVudHMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuc2V0Wm9vbVBlcmMgPSAoXG4gICAgcGFyZW50UG9ydDogYW55LFxuICAgIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuICAgIHpvb21QZXJjOiBudW1iZXIsXG4gICkgPT4ge1xuICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKCd6b29tUGVyYycsIHpvb21QZXJjLnRvU3RyaW5nKCkpO1xuICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cuc2V0QWlDb250ZXh0ID0gKFxuICAgIHBhcmVudFBvcnQ6IGFueSxcbiAgICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbiAgICBhaUNvbnRleHQ6IGJvb2xlYW4sXG4gICkgPT4ge1xuICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKCdhaUNvbnRleHQnLCAhIWFpQ29udGV4dCk7XG4gICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgfTtcblxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy50ZW1wTW92ZUVsZW1lbnQgPSAoXG4gICAgcGFyZW50UG9ydDogYW55LFxuICAgIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuICAgIG5vZGVUb01vdmVFbGVtZW50S2V5OiBzdHJpbmcsXG4gICAgbmV3SW5kZXg6IG51bWJlcixcbiAgKSA9PiB7XG4gICAgY29uc3QgZWxlbWVudEtleVRvTmF2Tm9kZSA9XG4gICAgICBnZXRNZW1vcnlTdG9yYWdlSXRlbShFTEVNRU5UX0tFWV9UT19OQVZfTk9ERSkgfHwge307XG5cbiAgICBjb25zdCBuYXZOb2RlVG9Nb3ZlID0gZWxlbWVudEtleVRvTmF2Tm9kZVtub2RlVG9Nb3ZlRWxlbWVudEtleV07XG4gICAgaWYgKCFuYXZOb2RlVG9Nb3ZlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgbm9kZVRvTW92ZUVsZW1lbnQgPSBUZW1wb0VsZW1lbnQuZnJvbUtleShub2RlVG9Nb3ZlRWxlbWVudEtleSk7XG5cbiAgICBjb25zdCBkb21FbGVtZW50c1RvTW92ZTogYW55W10gPSBbXTtcbiAgICAvLyBJbiBjb21wb25lbnRzLCB0aGVyZSBtYXkgYmUgbXVsdGlwbGUgZWxlbWVudHMgdGhhdCBuZWVkIHRvIGJlIG1vdmVkLCB0aGUgZWxlZW1udEtleVRvTG9va3VwTGlzdFxuICAgIC8vIGFyZSBhbGwgdGhlIHJlYWwgRE9NIGVsZW1lbnRzIGluIGEgY29tcG9uZW50XG4gICAgLy8gRm9yIG5vbi1jb21wb25lbnRzLCB0aGUgZWxlZW1udEtleVRvTG9va3VwTGlzdCBwb2ludHMgdG8gYSBsaXN0IG9mIGl0c2VsZlxuICAgIGNvbnN0IGVsZW1lbnRLZXlUb0xvb2t1cExpc3Q6IGFueSA9XG4gICAgICBnZXRNZW1vcnlTdG9yYWdlSXRlbShFTEVNRU5UX0tFWV9UT19MT09LVVBfTElTVCkgfHwge307XG4gICAgY29uc3QgbG9va3VwTGlzdCA9XG4gICAgICBlbGVtZW50S2V5VG9Mb29rdXBMaXN0W25hdk5vZGVUb01vdmUudGVtcG9FbGVtZW50LmdldEtleSgpXSB8fCBbXTtcbiAgICBsb29rdXBMaXN0LmZvckVhY2goKGxvb2t1cEVsZW1lbnRLZXk6IHN0cmluZykgPT4ge1xuICAgICAgZG9tRWxlbWVudHNUb01vdmUucHVzaChcbiAgICAgICAgJCgnYm9keScpLmZpbmQoYC4ke0VMRU1FTlRfS0VZX1BSRUZJWH0ke2xvb2t1cEVsZW1lbnRLZXl9YCkuZ2V0KDApLFxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHBhcmVudERvbUVsZW1lbnQgPSBkb21FbGVtZW50c1RvTW92ZVswXT8ucGFyZW50RWxlbWVudDtcbiAgICBjb25zdCBwYXJlbnROYXZOb2RlID0gbmF2Tm9kZVRvTW92ZS5wYXJlbnQ7XG5cbiAgICBpZiAocGFyZW50RG9tRWxlbWVudCAmJiBwYXJlbnROYXZOb2RlKSB7XG4gICAgICBjb25zdCBjdXJyZW50SW5kZXggPSBwYXJlbnROYXZOb2RlPy5jaGlsZHJlbj8uaW5kZXhPZihuYXZOb2RlVG9Nb3ZlKTtcbiAgICAgIGNvbnN0IG51bUNoaWxkcmVuID0gcGFyZW50TmF2Tm9kZT8uY2hpbGRyZW4/Lmxlbmd0aDtcblxuICAgICAgaWYgKGN1cnJlbnRJbmRleCAhPT0gbmV3SW5kZXgpIHtcbiAgICAgICAgQXJyYXkuZnJvbShwYXJlbnREb21FbGVtZW50LmNoaWxkcmVuKS5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgJChjaGlsZCkuYXR0cihURU1QT19JTlNUQU5UX1VQREFURSwgJ3RydWUnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChwYXJlbnREb21FbGVtZW50KS5hdHRyKFRFTVBPX0lOU1RBTlRfVVBEQVRFLCAndHJ1ZScpO1xuXG4gICAgICAgIGlmIChuZXdJbmRleCA9PT0gbnVtQ2hpbGRyZW4gLSAxKSB7XG4gICAgICAgICAgZG9tRWxlbWVudHNUb01vdmUuZm9yRWFjaCgoZWxlbWVudDogYW55KSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgaW5kZXggaXMgYmVmb3JlIHRoZSBuZXcgaW5kZXggdGhlbiB3ZSBuZWVkIHRvIGFkanVzdCBieSAxIHRvIGFjY291bnQgZm9yIHRoZSBzaGlmdCBpbiBpbmRpY2VzXG4gICAgICAgICAgY29uc3QgYmVmb3JlTm9kZSA9XG4gICAgICAgICAgICBjdXJyZW50SW5kZXggPiBuZXdJbmRleFxuICAgICAgICAgICAgICA/IHBhcmVudE5hdk5vZGU/LmNoaWxkcmVuW25ld0luZGV4XVxuICAgICAgICAgICAgICA6IHBhcmVudE5hdk5vZGU/LmNoaWxkcmVuW25ld0luZGV4ICsgMV07XG4gICAgICAgICAgY29uc3QgbG9va3VwTGlzdEZvckJlZm9yZSA9XG4gICAgICAgICAgICBlbGVtZW50S2V5VG9Mb29rdXBMaXN0W2JlZm9yZU5vZGU/LnRlbXBvRWxlbWVudD8uZ2V0S2V5KCldIHx8IFtdO1xuXG4gICAgICAgICAgaWYgKCFsb29rdXBMaXN0Rm9yQmVmb3JlLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Nhbm5vdCBmaW5kIGVsZW1lbnQgdG8gaW5zZXJ0IGJlZm9yZSBpbiBsb29rdXAgbGlzdCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGJlZm9yZURvbUVsZW1lbnQgPSAkKCdib2R5JylcbiAgICAgICAgICAgIC5maW5kKGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtsb29rdXBMaXN0Rm9yQmVmb3JlWzBdfWApXG4gICAgICAgICAgICAuZ2V0KDApO1xuXG4gICAgICAgICAgaWYgKCFiZWZvcmVEb21FbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQ2Fubm90IGZpbmQgZWxlbWVudCB0byBpbnNlcnQgYmVmb3JlJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZG9tRWxlbWVudHNUb01vdmUuZm9yRWFjaCgoZWxlbWVudDogYW55KSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIGJlZm9yZURvbUVsZW1lbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBzZWxlY3RlZCBlbGVtZW50IGtleSB0byB0aGUgbmV3IGV4cGVjdGVkIG9uZSAobm90ZSBpZiBtb3ZpbmcgdGhlcmUgaXMgbm8gaG92ZXJlZCBlbGVtZW50IGtleSlcbiAgICAgICAgLy8gVGhpcyBhbHNvIGFzc3VtZXMgdGhlIG5vZGVUb01vdmVFbGVtZW50S2V5IGlzIHRoZSBzZWxlY3RlZCBlbGVtZW50IGtleVxuICAgICAgICBjb25zdCBlbGVtZW50VG9Nb3ZlU2VnbWVudHMgPSBub2RlVG9Nb3ZlRWxlbWVudC51bmlxdWVQYXRoLnNwbGl0KCctJyk7XG4gICAgICAgIGNvbnN0IG5ld1NlbGVjdGVkVW5pcXVlUGF0aCA9XG4gICAgICAgICAgZWxlbWVudFRvTW92ZVNlZ21lbnRzXG4gICAgICAgICAgICAuc2xpY2UoMCwgZWxlbWVudFRvTW92ZVNlZ21lbnRzLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAuam9pbignLScpICsgYC0ke25ld0luZGV4fWA7XG5cbiAgICAgICAgY29uc3QgbmV3U2VsZWN0ZWRFbGVtZW50S2V5ID0gbmV3IFRlbXBvRWxlbWVudChcbiAgICAgICAgICBub2RlVG9Nb3ZlRWxlbWVudC5jb2RlYmFzZUlkLFxuICAgICAgICAgIG5vZGVUb01vdmVFbGVtZW50LnN0b3J5Ym9hcmRJZCxcbiAgICAgICAgICBuZXdTZWxlY3RlZFVuaXF1ZVBhdGgsXG4gICAgICAgICkuZ2V0S2V5KCk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBuYXYgdHJlZSB3aGljaCBhbHNvIHNldHMgdGhlIGVsZW1lbnQga2V5IG9uIGFsbCB0aGUgZWxlbWVudHMsIG5lZWQgdG8gZG8gdGhpcyBiZWZvcmVcbiAgICAgICAgLy8gdXBkYXRpbmcgdGhlIHNlbGVjdGVkIGVsZW1lbnQga2V5XG4gICAgICAgIGJ1aWxkQW5kU2VuZE5hdlRyZWUocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcblxuICAgICAgICAvLyBDb2RlYmFzZSBJRCBkb2Vzbid0IGNoYW5nZVxuICAgICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLlNFTEVDVEVEX0VMRU1FTlRfS0VZLFxuICAgICAgICAgIGVsZW1lbnRLZXk6IG5ld1NlbGVjdGVkRWxlbWVudEtleSxcbiAgICAgICAgICBvdXRlckhUTUw6ICQoYC4ke0VMRU1FTlRfS0VZX1BSRUZJWH0ke25ld1NlbGVjdGVkRWxlbWVudEtleX1gKS5nZXQoMClcbiAgICAgICAgICAgID8ub3V0ZXJIVE1MLFxuICAgICAgICB9KTtcbiAgICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVksIG5ld1NlbGVjdGVkRWxlbWVudEtleSk7XG5cbiAgICAgICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cudGVtcEFkZERpdiA9IChcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgcGFyZW50Q29kZWJhc2VJZDogc3RyaW5nLFxuICAgIGluZGV4SW5QYXJlbnQ6IG51bWJlcixcbiAgICB3aWR0aDogbnVtYmVyLFxuICAgIGhlaWdodDogbnVtYmVyLFxuICApID0+IHtcbiAgICBjb25zdCBlbGVtZW50ID0gJChgLiR7VEVNUE9fSU5TVEFOVF9ESVZfRFJBV19DTEFTU31gKTtcbiAgICBpZiAoZWxlbWVudC5sZW5ndGgpIHtcbiAgICAgIGVsZW1lbnQuY3NzKCd3aWR0aCcsIHdpZHRoKTtcbiAgICAgIGVsZW1lbnQuY3NzKCdoZWlnaHQnLCBoZWlnaHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGFyZW50ID0gJChgLiR7cGFyZW50Q29kZWJhc2VJZH1gKTtcbiAgICAgIGlmICghcGFyZW50Lmxlbmd0aCkge1xuICAgICAgICBwYXJlbnQgPSAkKCdib2R5Jyk7XG4gICAgICB9XG5cbiAgICAgIHBhcmVudC5lYWNoKChpbmRleDogYW55LCBpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgbmV3RWxlbWVudCA9ICQoXG4gICAgICAgICAgYDxkaXYgY2xhc3M9XCIke1RFTVBPX0lOU1RBTlRfRElWX0RSQVdfQ0xBU1N9XCIgJHtURU1QT19ERUxFVEVfQUZURVJfSU5TVEFOVF9VUERBVEV9PVwidHJ1ZVwiICR7VEVNUE9fREVMRVRFX0FGVEVSX1JFRlJFU0h9PVwidHJ1ZVwiICR7VEVNUE9fSU5TVEFOVF9VUERBVEV9PVwidHJ1ZVwiPjwvZGl2PmAsXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgY2hpbGRBdEluZGV4ID0gJChpdGVtKS5jaGlsZHJlbigpLmVxKGluZGV4SW5QYXJlbnQpO1xuICAgICAgICBpZiAoY2hpbGRBdEluZGV4Py5sZW5ndGgpIHtcbiAgICAgICAgICBjaGlsZEF0SW5kZXguYmVmb3JlKG5ld0VsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICQoaXRlbSkuYXBwZW5kKG5ld0VsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gVXBkYXRlIHRoZSBuYXYgdHJlZVxuICAgICAgYnVpbGRBbmRTZW5kTmF2VHJlZShwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICAgIH1cblxuICAgIHVwZGF0ZU91dGxpbmVzKHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCk7XG4gIH07XG5cbiAgLy8gQHRzLWlnbm9yZVxuICB3aW5kb3cudGVtcE1vdmVUb05ld1BhcmVudCA9IChcbiAgICBwYXJlbnRQb3J0OiBhbnksXG4gICAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gICAgaW5kaWNhdG9yV2lkdGg6IG51bWJlcixcbiAgICBpbmRpY2F0b3JIZWlnaHQ6IG51bWJlcixcbiAgICBuZXdQb3NpdGlvblg6IG51bWJlcixcbiAgICBuZXdQb3NpdGlvblk6IG51bWJlcixcbiAgICBwYXJlbnRFbGVtZW50S2V5OiBzdHJpbmcsXG4gICAgY2xlYXI6IGJvb2xlYW4sXG4gICkgPT4ge1xuICAgICQoYC4ke1RFTVBPX01PVkVfQkVUV0VFTl9QQVJFTlRTX09VVExJTkV9YCkucmVtb3ZlKCk7XG5cbiAgICBpZiAoY2xlYXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbmV3RWxlbWVudC5jbGFzc0xpc3QuYWRkKFRFTVBPX01PVkVfQkVUV0VFTl9QQVJFTlRTX09VVExJTkUpO1xuICAgIG5ld0VsZW1lbnQuc2V0QXR0cmlidXRlKFRFTVBPX0lOU1RBTlRfVVBEQVRFLCAndHJ1ZScpOyAvLyBBZGQgc28gaXQgZG9lc24ndCB0cmlnZ2VyIG5ldyBuYXYgdHJlZSBidWlsZGluZ1xuXG4gICAgbmV3RWxlbWVudC5zdHlsZS53aWR0aCA9IGluZGljYXRvcldpZHRoICsgJ3B4JztcbiAgICBuZXdFbGVtZW50LnN0eWxlLmhlaWdodCA9IGluZGljYXRvckhlaWdodCArICdweCc7XG4gICAgbmV3RWxlbWVudC5zdHlsZS5sZWZ0ID0gbmV3UG9zaXRpb25YICsgJ3B4JztcbiAgICBuZXdFbGVtZW50LnN0eWxlLnRvcCA9IG5ld1Bvc2l0aW9uWSArICdweCc7XG4gICAgbmV3RWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgbmV3RWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgIG5ld0VsZW1lbnQuc3R5bGUuekluZGV4ID0gJzIwMDAwMDAwMDQnO1xuICAgIG5ld0VsZW1lbnQuc3R5bGUuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICAgIG5ld0VsZW1lbnQuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQgIWltcG9ydGFudCc7XG4gICAgbmV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBQUklNQVJZX09VVExJTkVfQ09MT1VSO1xuXG4gICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgYm9keS5hcHBlbmRDaGlsZChuZXdFbGVtZW50KTtcblxuICAgIGNvbnN0IHBhcmVudERvbUVsZW1lbnQgPSAkKGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtwYXJlbnRFbGVtZW50S2V5fWApLmdldChcbiAgICAgIDAsXG4gICAgKTtcblxuICAgIGlmIChwYXJlbnREb21FbGVtZW50KSB7XG4gICAgICBjb25zdCBib3VuZGluZ1JlY3QgPSBwYXJlbnREb21FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgcGFyZW50T3V0bGluZSA9IGdldE91dGxpbmVFbGVtZW50KFxuICAgICAgICBwYXJlbnRQb3J0LFxuICAgICAgICBPdXRsaW5lVHlwZS5QUklNQVJZLFxuICAgICAgICBib3VuZGluZ1JlY3QubGVmdCxcbiAgICAgICAgYm91bmRpbmdSZWN0LnRvcCxcbiAgICAgICAgYm91bmRpbmdSZWN0LndpZHRoLFxuICAgICAgICBib3VuZGluZ1JlY3QuaGVpZ2h0LFxuICAgICAgKTtcblxuICAgICAgcGFyZW50T3V0bGluZS5jbGFzc0xpc3QucmVtb3ZlKE9VVExJTkVfQ0xBU1MpO1xuICAgICAgcGFyZW50T3V0bGluZS5jbGFzc0xpc3QuYWRkKFRFTVBPX01PVkVfQkVUV0VFTl9QQVJFTlRTX09VVExJTkUpO1xuICAgICAgcGFyZW50T3V0bGluZS5zZXRBdHRyaWJ1dGUoVEVNUE9fSU5TVEFOVF9VUERBVEUsICd0cnVlJyk7IC8vIEFkZCBzbyBpdCBkb2Vzbid0IHRyaWdnZXIgbmV3IG5hdiB0cmVlIGJ1aWxkaW5nXG4gICAgICBib2R5LmFwcGVuZENoaWxkKHBhcmVudE91dGxpbmUpO1xuICAgIH1cbiAgfTtcblxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy5jaGVja0lmSHlkcmF0aW9uRXJyb3IgPSAocGFyZW50UG9ydDogYW55LCBzdG9yeWJvYXJkSWQ6IHN0cmluZykgPT4ge1xuICAgIGxldCBlcnJvckRlc2NyLCBlcnJvckxhYmVsLCBlcnJvckJvZHksIGhhc0Vycm9yO1xuICAgIGlmICh3aW5kb3cubG9jYXRpb24uaHJlZi5pbmNsdWRlcygnZnJhbWV3b3JrPVZJVEUnKSkge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgZXJyb3JQb3J0YWwgPVxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndml0ZS1lcnJvci1vdmVybGF5JylbMF0/LnNoYWRvd1Jvb3Q7XG5cbiAgICAgIGVycm9yRGVzY3IgPSAnQSBWaXRlIEVycm9yIE9jY3VycmVkJztcbiAgICAgIGVycm9yTGFiZWwgPVxuICAgICAgICBlcnJvclBvcnRhbD8ucXVlcnlTZWxlY3RvckFsbD8uKCcuZmlsZS1saW5rJyk/LlswXT8uaW5uZXJIVE1MO1xuICAgICAgZXJyb3JCb2R5ID0gZXJyb3JQb3J0YWw/LnF1ZXJ5U2VsZWN0b3JBbGw/LignLm1lc3NhZ2UnKT8uWzBdPy5pbm5lckhUTUw7XG4gICAgICBoYXNFcnJvciA9IEJvb2xlYW4oZXJyb3JMYWJlbCB8fCBlcnJvckJvZHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBjb25zdCBlcnJvclBvcnRhbCA9XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCduZXh0anMtcG9ydGFsJylbMF0/LnNoYWRvd1Jvb3Q7XG4gICAgICBlcnJvckRlc2NyID0gZXJyb3JQb3J0YWw/LmdldEVsZW1lbnRCeUlkPy4oXG4gICAgICAgICduZXh0anNfX2NvbnRhaW5lcl9lcnJvcnNfZGVzYycsXG4gICAgICApPy5pbm5lckhUTUw7XG4gICAgICBlcnJvckxhYmVsID0gZXJyb3JQb3J0YWw/LmdldEVsZW1lbnRCeUlkPy4oXG4gICAgICAgICduZXh0anNfX2NvbnRhaW5lcl9lcnJvcnNfbGFiZWwnLFxuICAgICAgKT8uaW5uZXJIVE1MO1xuICAgICAgZXJyb3JCb2R5ID0gZXJyb3JQb3J0YWw/LnF1ZXJ5U2VsZWN0b3JBbGw/LihcbiAgICAgICAgJy5uZXh0anMtY29udGFpbmVyLWVycm9ycy1ib2R5JyxcbiAgICAgICk/LlswXT8uaW5uZXJIVE1MO1xuICAgICAgaGFzRXJyb3IgPSBCb29sZWFuKGVycm9yRGVzY3IpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHRoZSBjb250ZW50cyBvZiB0aGUgaHlkcmF0aW9uIGNvbnRhaW5lciBjb250YWluIHRoZSB0ZXh0IFwiSHlkcmF0aW9uIGZhaWxlZFwiXG4gICAgaWYgKGhhc0Vycm9yKSB7XG4gICAgICBpZiAoZXJyb3JEZXNjcj8uaW5jbHVkZXMoJ0h5ZHJhdGlvbiBmYWlsZWQnKSkge1xuICAgICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLkxBVEVTVF9IWURSQVRJT05fRVJST1JfU1RBVFVTLFxuICAgICAgICAgIHN0YXR1czogU1RPUllCT0FSRF9IWURSQVRJT05fU1RBVFVTLkVSUk9SLFxuICAgICAgICAgIGVycm9yRGVzY3IsXG4gICAgICAgICAgZXJyb3JMYWJlbCxcbiAgICAgICAgICBlcnJvckJvZHksXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5MQVRFU1RfSFlEUkFUSU9OX0VSUk9SX1NUQVRVUyxcbiAgICAgICAgICBzdGF0dXM6IFNUT1JZQk9BUkRfSFlEUkFUSU9OX1NUQVRVUy5PVEhFUl9FUlJPUixcbiAgICAgICAgICBlcnJvckRlc2NyLFxuICAgICAgICAgIGVycm9yTGFiZWwsXG4gICAgICAgICAgZXJyb3JCb2R5LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuTEFURVNUX0hZRFJBVElPTl9FUlJPUl9TVEFUVVMsXG4gICAgICAgIHN0YXR1czogU1RPUllCT0FSRF9IWURSQVRJT05fU1RBVFVTLk5PX0VSUk9SLFxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LnRyaWdnZXJEcmFnU3RhcnQgPSAocGFyZW50UG9ydDogYW55LCBzdG9yeWJvYXJkSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHNlbGVjdGVkRWxlbWVudEtleSA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKFNFTEVDVEVEX0VMRU1FTlRfS0VZKTtcbiAgICBjb25zdCBlbGVtZW50S2V5VG9OYXZOb2RlID1cbiAgICAgIGdldE1lbW9yeVN0b3JhZ2VJdGVtKEVMRU1FTlRfS0VZX1RPX05BVl9OT0RFKSB8fCB7fTtcblxuICAgIC8vIFNvbWV0aGluZyBoYXMgdG8gYmUgc2VsZWN0ZWQgdG8gdHJpZ2dlciBhIGRyYWcgc3RhcnRcbiAgICBpZiAoIXNlbGVjdGVkRWxlbWVudEtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRyYWdnZWROYXZOb2RlID0gZWxlbWVudEtleVRvTmF2Tm9kZVtzZWxlY3RlZEVsZW1lbnRLZXldO1xuXG4gICAgY29uc3QgcGFyZW50RG9tRWxlbWVudCA9IGdldFBhcmVudERvbUVsZW1lbnRGb3JOYXZOb2RlKGRyYWdnZWROYXZOb2RlKTtcblxuICAgIGNvbnN0IHNlbGVjdGVkRWxlbWVudCA9ICQoXG4gICAgICBgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7c2VsZWN0ZWRFbGVtZW50S2V5fWAsXG4gICAgKS5nZXQoMCk7XG5cbiAgICBjb25zdCBtb3VzZURyYWdDb250ZXh0OiBhbnkgPSB7XG4gICAgICAvLyBTdGFydCBvZmYgc2NyZWVuLCB0aGlzIHdpbGwgZ2V0IHVwZGF0ZWQgYnkgb25Nb3VzZU1vdmVcbiAgICAgIHBhZ2VYOiAtMTAwMDAsXG4gICAgICBwYWdlWTogLTEwMDAwLFxuXG4gICAgICAvLyBUaGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHdoZXJlIHRoZSB1c2VyIGNsaWNrZWQgYW5kIHRoZSBjZW50ZXIgb2YgdGhlIGVsZW1lbnRcbiAgICAgIG9mZnNldFg6IDAsXG4gICAgICBvZmZzZXRZOiAwLFxuXG4gICAgICBkcmFnZ2luZzogdHJ1ZSxcblxuICAgICAgc2VsZWN0ZWRQYXJlbnREaXNwbGF5OiBjc3NFdmFsKHBhcmVudERvbUVsZW1lbnQsICdkaXNwbGF5JyksXG4gICAgICBzZWxlY3RlZFBhcmVudEZsZXhEaXJlY3Rpb246IGNzc0V2YWwocGFyZW50RG9tRWxlbWVudCwgJ2ZsZXgtZGlyZWN0aW9uJyksXG4gICAgfTtcblxuICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKCdtb3VzZURyYWdDb250ZXh0JywgbW91c2VEcmFnQ29udGV4dCk7XG5cbiAgICAvLyBUcmlnZ2VyIHRoZSBkcmFnIHN0YXJ0IGV2ZW50XG4gICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLkRSQUdfU1RBUlRfRVZFTlQsXG4gICAgICBldmVudDogbW91c2VEcmFnQ29udGV4dCxcbiAgICAgIG91dGVySFRNTDogc2VsZWN0ZWRFbGVtZW50Py5vdXRlckhUTUwsXG4gICAgfSk7XG5cbiAgICB1cGRhdGVPdXRsaW5lcyhwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQpO1xuICB9O1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LnRyaWdnZXJEcmFnQ2FuY2VsID0gKHBhcmVudFBvcnQ6IGFueSwgc3Rvcnlib2FyZElkOiBzdHJpbmcpID0+IHtcbiAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbSgnbW91c2VEcmFnQ29udGV4dCcsIG51bGwpO1xuXG4gICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICBpZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLkRSQUdfQ0FOQ0VMX0VWRU5ULFxuICAgICAgZXZlbnQ6IHt9LFxuICAgIH0pO1xuXG4gICAgdXBkYXRlT3V0bGluZXMocGFyZW50UG9ydCwgc3Rvcnlib2FyZElkKTtcbiAgfTtcblxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy5zZXRJc0ZsdXNoaW5nID0gKFxuICAgIHBhcmVudFBvcnQ6IGFueSxcbiAgICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbiAgICBpc0ZsdXNoaW5nOiBib29sZWFuLFxuICApID0+IHtcbiAgICBjb25zdCB3YXNGbHVzaGluZyA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKElTX0ZMVVNISU5HKTtcblxuICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKElTX0ZMVVNISU5HLCBpc0ZsdXNoaW5nKTtcblxuICAgIGlmIChpc0ZsdXNoaW5nICYmICF3YXNGbHVzaGluZykge1xuICAgICAgb25GbHVzaFN0YXJ0KCk7XG4gICAgfVxuICB9O1xufTtcbiJdfQ==