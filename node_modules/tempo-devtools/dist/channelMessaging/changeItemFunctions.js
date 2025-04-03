"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCodebaseIds = exports.applyChangeItemToDocument = exports.TEMPORARY_STYLING_CLASS_NAME = exports.ADD_CLASS_INSTANT_UPDATE_QUEUE = exports.ADD_JSX_PREFIX = exports.DUPLICATE_PLACEHOLDER_PREFIX = exports.WRAP_IN_DIV_PLACEHOLDER_CODEBASE_ID = void 0;
const jquery_1 = __importDefault(require("jquery"));
const identifierUtils_1 = require("./identifierUtils");
const changeLedgerTypes_1 = require("./changeLedgerTypes");
const constantsAndTypes_1 = require("./constantsAndTypes");
const cssRuleUtils_1 = require("./cssRuleUtils");
const sessionStorageUtils_1 = require("./sessionStorageUtils");
const tempoElement_1 = require("./tempoElement");
const uuid_1 = require("uuid");
// These constants match what tempo-api has
exports.WRAP_IN_DIV_PLACEHOLDER_CODEBASE_ID = 'tempo-wrap-in-div-placeholder';
exports.DUPLICATE_PLACEHOLDER_PREFIX = 'tempo-duplicate-placeholder-';
exports.ADD_JSX_PREFIX = 'tempo-add-jsx-placeholder-';
// Stored in memory storage, used to keep track of some possible add class instant
// updates that need to be re-applied after a hot reload
// (e.g. when the additional) instant updates happened during flushing
exports.ADD_CLASS_INSTANT_UPDATE_QUEUE = 'ADD_CLASS_INSTANT_UPDATE_QUEUE';
exports.TEMPORARY_STYLING_CLASS_NAME = 'arb89-temp-styling';
const getTopLevelCodebaseIdForComponent = (componentId) => {
    let topLevelCodebaseId = null;
    let minNumberParents = Infinity;
    (0, jquery_1.default)(`.component-${componentId}`).each((index, element) => {
        if ((0, jquery_1.default)(element).parents().length < minNumberParents) {
            minNumberParents = (0, jquery_1.default)(element).parents().length;
            topLevelCodebaseId = (0, identifierUtils_1.getCodebaseIdFromNode)(element);
        }
    });
    return topLevelCodebaseId;
};
const makeid = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};
const addOrEditCSSRule = (selector, rules, id) => {
    var styleEl = document.createElement('style');
    if (id) {
        const existingElement = document.getElementById(id);
        if (existingElement) {
            existingElement.remove();
        }
        styleEl.id = id;
    }
    // Append <style> element to <head>
    document.head.appendChild(styleEl);
    var styleSheet = styleEl.sheet;
    if (styleSheet.insertRule) {
        // All browsers, except IE before version 9
        styleSheet.insertRule(selector + '{' + rules + '}', styleSheet.cssRules.length);
    }
    else if (styleSheet.addRule) {
        // IE before version 9
        styleSheet.addRule(selector, rules, styleSheet.rules.length);
    }
};
const applyChangeItemToDocument = (parentPort, storyboardId, plainChangeItem) => {
    var _a;
    if (!plainChangeItem || !plainChangeItem.type) {
        return { sendNewNavTree: false, instantUpdateSuccessful: false };
    }
    const changeItem = (0, changeLedgerTypes_1.reconstructChangeLedgerClass)(plainChangeItem);
    let extraInstantUpdateData = {};
    let instantUpdateSuccessful = false;
    // The display: none rule is needed for a lot of instant updates, so create it if it doesn't exist
    if (!document.getElementById(identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS)) {
        addOrEditCSSRule(`.${identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS}`, 'display: none !important', identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS);
    }
    let sendNewNavTree = false;
    if (changeItem.type === changeLedgerTypes_1.ChangeType.ADD_JSX) {
        const castChangeItem = changeItem;
        const changeFields = castChangeItem.changeFields;
        const newAddedIds = [];
        if (changeFields.htmlForInstantUpdate) {
            const elementToAdd = (0, jquery_1.default)(changeFields.htmlForInstantUpdate);
            elementToAdd.attr(identifierUtils_1.TEMPO_DELETE_AFTER_REFRESH, 'true');
            elementToAdd.attr(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true'); // So that the DOM tree refresh doesn't get triggered
            elementToAdd.attr(identifierUtils_1.TEMPO_OUTLINE_UNTIL_REFESH, 'true');
            const ID_FOR_ELEMENT = `${exports.ADD_JSX_PREFIX}${(0, uuid_1.v4)()}`;
            elementToAdd.attr(identifierUtils_1.TEMPO_ELEMENT_ID, ID_FOR_ELEMENT);
            elementToAdd.addClass(ID_FOR_ELEMENT);
            newAddedIds.push(ID_FOR_ELEMENT);
            (0, jquery_1.default)(`.${changeFields.codebaseIdToAddTo}`).each((index, item) => {
                if (changeFields.afterCodebaseId) {
                    const afterElement = (0, jquery_1.default)(`.${changeFields.afterCodebaseId}`);
                    if (!(afterElement === null || afterElement === void 0 ? void 0 : afterElement.length)) {
                        return;
                    }
                    elementToAdd.insertAfter(afterElement.first());
                }
                else if (changeFields.beforeCodebaseId) {
                    const beforeElement = (0, jquery_1.default)(`.${changeFields.beforeCodebaseId}`);
                    if (!(beforeElement === null || beforeElement === void 0 ? void 0 : beforeElement.length)) {
                        return;
                    }
                    elementToAdd.insertBefore(beforeElement.first());
                }
                else {
                    (0, jquery_1.default)(item).append(elementToAdd);
                }
                sendNewNavTree = true;
                instantUpdateSuccessful = true;
            });
        }
        extraInstantUpdateData['newAddedIds'] = newAddedIds;
    }
    else if (changeItem.type === changeLedgerTypes_1.ChangeType.MOVE_JSX) {
        const castChangeItem = changeItem;
        // Find each element that matches the jsxCodebaseId
        const sourceElements = [];
        // See if direct matches work first
        if ((0, jquery_1.default)(`.${castChangeItem.changeFields.codebaseIdToMove}`).length > 0) {
            (0, jquery_1.default)(`.${castChangeItem.changeFields.codebaseIdToMove}`).each((index, element) => {
                sourceElements.push((0, jquery_1.default)(element));
            });
        }
        else {
            // Try to find it by the component ID
            let topLevelCodebaseId = getTopLevelCodebaseIdForComponent(castChangeItem.changeFields.codebaseIdToMove || '');
            if (topLevelCodebaseId) {
                (0, jquery_1.default)(`.${topLevelCodebaseId}`).each((index, element) => {
                    sourceElements.push((0, jquery_1.default)(element));
                });
            }
        }
        // If the container is a component, drop into the codebaseId of the top-most child div
        let containerCodebaseId = getTopLevelCodebaseIdForComponent(castChangeItem.changeFields.codebaseIdToMoveTo || '') || castChangeItem.changeFields.codebaseIdToMoveTo;
        // For each source element, find the new matching parent element
        const newParentElements = [];
        sourceElements.forEach((element) => {
            let newParentElement = null;
            // For each parent, try to see if it either matches or contains the new parent
            let parentElement = element.parent();
            while (parentElement.length) {
                // If the parent directly matches, this is it
                if (parentElement.hasClass(containerCodebaseId)) {
                    newParentElement = parentElement;
                    break;
                }
                // Check children that match the codebase ID to drop into
                const matchingChildren = parentElement.find(`.${containerCodebaseId}`);
                if (matchingChildren.length) {
                    // TODO: What if this matches more than one?
                    newParentElement = matchingChildren.first();
                    break;
                }
                parentElement = parentElement.parent();
            }
            if (!newParentElement) {
                newParentElements.push(null);
                return;
            }
            newParentElements.push(newParentElement);
        });
        // For each child/parentElement pair, move the child to the new parent
        sourceElements.forEach((element, index) => {
            const newParentElement = newParentElements[index];
            if (!newParentElement.length) {
                console.log('Could not find new parent element for instant update');
                return;
            }
            sendNewNavTree = true;
            instantUpdateSuccessful = true;
            element.attr(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true');
            // If the parent hasn't changed, just move it, otherwise clone it and create a new one in the new spot
            let useClone = !newParentElement.is(element.parent());
            // So that nextjs hot reloading works, simply hide the element and clone it into the new spot
            let cloneElement;
            if (useClone) {
                cloneElement = element.clone();
                cloneElement.attr(identifierUtils_1.TEMPO_DELETE_AFTER_REFRESH, 'true');
                element.addClass(identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS);
                element.attr(identifierUtils_1.TEMPO_DO_NOT_SHOW_IN_NAV_UNTIL_REFRESH, 'true');
            }
            if (castChangeItem.changeFields.afterCodebaseId) {
                const afterIdToUse = getTopLevelCodebaseIdForComponent(castChangeItem.changeFields.afterCodebaseId) || castChangeItem.changeFields.afterCodebaseId;
                const afterElement = newParentElement.children(`.${afterIdToUse}`);
                if (afterElement.length) {
                    if (useClone && cloneElement) {
                        cloneElement.insertAfter(afterElement.first());
                    }
                    else {
                        element.insertAfter(afterElement.first());
                    }
                    return;
                }
            }
            if (castChangeItem.changeFields.beforeCodebaseId) {
                const beforeIdToUse = getTopLevelCodebaseIdForComponent(castChangeItem.changeFields.beforeCodebaseId) || castChangeItem.changeFields.beforeCodebaseId;
                const beforeElement = newParentElement.children(`.${beforeIdToUse}`);
                if (beforeElement.length) {
                    if (useClone && cloneElement) {
                        cloneElement.insertBefore(beforeElement.first());
                    }
                    else {
                        element.insertBefore(beforeElement.first());
                    }
                    return;
                }
            }
            if (useClone && cloneElement) {
                cloneElement.appendTo(newParentElement);
            }
            else {
                element.appendTo(newParentElement);
            }
        });
    }
    else if (changeItem.type === changeLedgerTypes_1.ChangeType.REMOVE_JSX) {
        const castChangeItem = changeItem;
        const parentToElementKeysRemoved = {};
        castChangeItem.changeFields.codebaseIdsToRemove.forEach((codebaseId) => {
            // See if direct matches work first
            let codebaseIdToRemove;
            if ((0, jquery_1.default)(`.${codebaseId}`).length > 0) {
                codebaseIdToRemove = codebaseId;
            }
            else {
                // Try to find it by the component ID
                let topLevelCodebaseId = getTopLevelCodebaseIdForComponent(codebaseId || '');
                if (!topLevelCodebaseId) {
                    console.log('Could not find component element for instant update');
                    return false;
                }
                codebaseIdToRemove = topLevelCodebaseId;
            }
            // For each item that is removed, save the inner HTML in case it gets deleted and we want to undo
            (0, jquery_1.default)(`.${codebaseIdToRemove}`).each((index, item) => {
                const elementKeyRemoved = (0, identifierUtils_1.getElementKeyFromNode)(item);
                const parentElementKey = (0, identifierUtils_1.getElementKeyFromNode)(item.parentElement);
                if (elementKeyRemoved && parentElementKey) {
                    if (!parentToElementKeysRemoved[parentElementKey]) {
                        parentToElementKeysRemoved[parentElementKey] = [];
                    }
                    parentToElementKeysRemoved[parentElementKey].push({
                        outerHTML: item.outerHTML,
                        elementKeyRemoved,
                    });
                }
                item.classList.add(identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS);
                item.setAttribute(identifierUtils_1.TEMPO_DO_NOT_SHOW_IN_NAV_UNTIL_REFRESH, 'true');
                sendNewNavTree = true;
                instantUpdateSuccessful = true;
            });
        });
        extraInstantUpdateData.parentToElementKeysRemoved =
            parentToElementKeysRemoved;
    }
    else if (changeItem.type === changeLedgerTypes_1.ChangeType.ADD_CLASS ||
        changeItem.type === changeLedgerTypes_1.ChangeType.STYLING) {
        let className, cssEquivalent, codebaseIdToAddClass, temporaryClass, codebaseClassName, modifiers;
        if (changeItem.type === changeLedgerTypes_1.ChangeType.ADD_CLASS) {
            const castChangeItem = changeItem;
            codebaseClassName = castChangeItem.changeFields.className;
            className = castChangeItem.changeFields.className;
            cssEquivalent = castChangeItem.changeFields.cssEquivalent;
            codebaseIdToAddClass = castChangeItem.changeFields.codebaseIdToAddClass;
            temporaryClass = castChangeItem.changeFields.temporaryOnly;
            modifiers = castChangeItem.changeFields.modifiers;
            if (temporaryClass) {
                className = exports.TEMPORARY_STYLING_CLASS_NAME;
            }
        }
        else {
            // As of March 6, 2024 we only support tailwind STYLING changes, so treat them as adding a class
            const castChangeItem = changeItem.changeFields;
            className = '';
            cssEquivalent = Object.keys(castChangeItem.stylingChanges)
                .map((key) => {
                if (castChangeItem.stylingChanges[key] === constantsAndTypes_1.DELETE_STYLE_CONSTANT) {
                    return `${(0, cssRuleUtils_1.camelToSnakeCase)(key)}: unset !important;`;
                }
                return `${(0, cssRuleUtils_1.camelToSnakeCase)(key)}: ${castChangeItem.stylingChanges[key]};`;
            })
                .join('');
            codebaseIdToAddClass = castChangeItem.codebaseId;
            modifiers = castChangeItem.modifiers;
        }
        const SAFE_CLASSNAME_REGEX = /[^A-Za-z0-9_-]/g;
        // Escape any custom classes
        let classToAdd = (className || '')
            .replace(SAFE_CLASSNAME_REGEX, '-') // Replace any non-alphanumeric characters with '-'
            .replace(/^\d/, '-$&'); // If the class starts with a digit, prepend with '-'
        // Instead of adding the class name, generate a new class and set the
        // css equivalent values inside it
        // This class will be deleted after a hot reload
        // Note - for temporary classes we want to explicitly use the same class
        if (cssEquivalent && !temporaryClass) {
            const msSinceJan1 = Date.now() - 1704067200000;
            classToAdd = `${identifierUtils_1.TEMPO_INSTANT_UPDATE_STYLING_PREFIX}${msSinceJan1}-${classToAdd}`;
        }
        if (classToAdd) {
            if (!temporaryClass) {
                // Clear the temporary class on this element if it has it
                (0, jquery_1.default)(`.${codebaseIdToAddClass}`).removeClass(exports.TEMPORARY_STYLING_CLASS_NAME);
            }
            if (cssEquivalent) {
                if (modifiers && modifiers.length > 0) {
                    const CSS_PSEUDO_MODIFIERS = [
                        'hover',
                        'required',
                        'focus',
                        'active',
                        'invalid',
                        'disabled',
                    ];
                    const pseudoModifiers = modifiers.filter((modifier) => CSS_PSEUDO_MODIFIERS.includes(modifier));
                    const pseudoModifiersSuffix = pseudoModifiers.join(':');
                    if (pseudoModifiers.length > 0) {
                        const modifierClass = `${classToAdd}:${pseudoModifiersSuffix}`;
                        addOrEditCSSRule(`.${modifierClass}`, cssEquivalent, modifierClass);
                    }
                    else {
                        addOrEditCSSRule(`.${classToAdd}`, cssEquivalent, classToAdd);
                    }
                    const forceClasses = modifiers
                        .map((modifier) => `.tempo-force-${modifier}`)
                        .join('');
                    const instantUpdateForForceClass = `${classToAdd}${forceClasses}`;
                    addOrEditCSSRule(`.${instantUpdateForForceClass}`, cssEquivalent, instantUpdateForForceClass);
                }
                else {
                    addOrEditCSSRule(`.${classToAdd}`, cssEquivalent, classToAdd);
                }
            }
            const currentAddClassValues = (0, sessionStorageUtils_1.getMemoryStorageItem)(exports.ADD_CLASS_INSTANT_UPDATE_QUEUE) || [];
            // See if direct matches work first
            if ((0, jquery_1.default)(`.${codebaseIdToAddClass}`).length > 0) {
                (0, jquery_1.default)(`.${codebaseIdToAddClass}`).addClass(classToAdd);
                instantUpdateSuccessful = true;
                currentAddClassValues.push({
                    codebaseId: codebaseIdToAddClass,
                    className: classToAdd,
                });
            }
            else {
                // Try to find it by the component ID
                let topLevelCodebaseId = getTopLevelCodebaseIdForComponent(codebaseIdToAddClass || '');
                if (topLevelCodebaseId && (0, jquery_1.default)(`.${topLevelCodebaseId}`).length > 0) {
                    instantUpdateSuccessful = true;
                    (0, jquery_1.default)(`.${topLevelCodebaseId}`).addClass(classToAdd);
                    currentAddClassValues.push({
                        codebaseId: topLevelCodebaseId,
                        className: classToAdd,
                    });
                }
            }
            (0, sessionStorageUtils_1.setMemoryStorageItem)(exports.ADD_CLASS_INSTANT_UPDATE_QUEUE, currentAddClassValues);
            extraInstantUpdateData.addedClass = classToAdd;
            extraInstantUpdateData.codebaseAddedClass = codebaseClassName;
        }
    }
    else if (changeItem.type === changeLedgerTypes_1.ChangeType.REMOVE_CLASS) {
        const removeClassChangeFields = changeItem.changeFields;
        // See if direct matches work first
        if ((0, jquery_1.default)(`.${removeClassChangeFields.codebaseIdToRemoveClass}`).length > 0) {
            (0, jquery_1.default)(`.${removeClassChangeFields.codebaseIdToRemoveClass}`).removeClass(removeClassChangeFields.className);
            instantUpdateSuccessful = true;
        }
        else {
            // Try to find it by the component ID
            let topLevelCodebaseId = getTopLevelCodebaseIdForComponent(removeClassChangeFields.codebaseIdToRemoveClass || '');
            if (topLevelCodebaseId && (0, jquery_1.default)(`.${topLevelCodebaseId}`).length > 0) {
                instantUpdateSuccessful = true;
                (0, jquery_1.default)(`.${topLevelCodebaseId}`).removeClass(removeClassChangeFields.className);
            }
        }
    }
    else if (changeItem.type === changeLedgerTypes_1.ChangeType.WRAP_DIV) {
        const changeFields = changeItem.changeFields;
        const codebaseIdsToWrap = changeFields.codebaseIdsToWrap;
        const firstCodebaseId = codebaseIdsToWrap[0];
        // We assume the other codebase IDs are siblings of this codebase ID, so we
        // find each instance of the first one and include the other items that match in it
        // If the other items aren't all found, we do not wrap and let hot reload handle it
        (0, jquery_1.default)(`.${firstCodebaseId}`).each((index, item) => {
            const otherCodebaseIds = codebaseIdsToWrap.slice(1);
            // For each codebase ID in otherCodebaseIds, retrieve the element that is a sibling of item
            const siblings = (0, jquery_1.default)(item).siblings();
            const allItemsToAddToNewDiv = [item];
            let earliestItem = item;
            let earliestIndex = (0, jquery_1.default)(item).index();
            otherCodebaseIds.forEach((codebaseId) => {
                const foundSibling = siblings.filter(`.${codebaseId}`).get(0);
                if (foundSibling) {
                    allItemsToAddToNewDiv.push(foundSibling);
                    const index = (0, jquery_1.default)(foundSibling).index();
                    if (index < earliestIndex) {
                        earliestItem = foundSibling;
                        earliestIndex = index;
                    }
                }
            });
            // TODO: What to do if they all can't be found?
            if (allItemsToAddToNewDiv.length !== codebaseIdsToWrap.length) {
                // For now, just add the ones that were found
            }
            // Create a div with a clone of the item, while hiding the item
            // When the hot reload happens the clone gets deleted and the item is shown again
            const newDiv = document.createElement('div');
            newDiv.className = exports.WRAP_IN_DIV_PLACEHOLDER_CODEBASE_ID;
            newDiv.setAttribute(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true'); // So that the DOM tree refresh doesn't get triggered
            newDiv.setAttribute('tempoelementid', exports.WRAP_IN_DIV_PLACEHOLDER_CODEBASE_ID);
            newDiv.setAttribute('data-testid', exports.WRAP_IN_DIV_PLACEHOLDER_CODEBASE_ID);
            newDiv.setAttribute(identifierUtils_1.TEMPO_DELETE_AFTER_REFRESH, 'true');
            allItemsToAddToNewDiv.forEach((elem) => {
                newDiv.appendChild(elem.cloneNode(true));
                elem.classList.add(identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS);
                elem.setAttribute(identifierUtils_1.TEMPO_DO_NOT_SHOW_IN_NAV_UNTIL_REFRESH, 'true');
            });
            // Insert the new div right before the first item
            earliestItem.insertAdjacentElement('beforebegin', newDiv);
            sendNewNavTree = true;
            instantUpdateSuccessful = true;
        });
    }
    else if (changeItem.type === changeLedgerTypes_1.ChangeType.DUPLICATE) {
        const changeFileds = changeItem.changeFields;
        const codebaseIdsToDuplicate = changeFileds.codebaseIdsToDuplicate;
        codebaseIdsToDuplicate.forEach((codebaseIdToDuplicate) => {
            (0, jquery_1.default)(`.${codebaseIdToDuplicate}`).each((index, item) => {
                const clonedNode = item.cloneNode(true);
                clonedNode.setAttribute(identifierUtils_1.TEMPO_DELETE_AFTER_REFRESH, 'true');
                clonedNode.setAttribute(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true'); // So that the DOM tree refresh doesn't get triggered
                // Set up all the correct duplicated codebase IDs
                clonedNode.setAttribute('tempoelementid', `${exports.DUPLICATE_PLACEHOLDER_PREFIX}${codebaseIdToDuplicate}`);
                clonedNode.setAttribute('data-testid', `${exports.DUPLICATE_PLACEHOLDER_PREFIX}${codebaseIdToDuplicate}`);
                clonedNode.classList.add(exports.DUPLICATE_PLACEHOLDER_PREFIX + codebaseIdToDuplicate);
                clonedNode.classList.remove(codebaseIdToDuplicate);
                let children = Array.from(clonedNode.children);
                while (children.length) {
                    const child = children.pop();
                    if (!child) {
                        continue;
                    }
                    const codebaseId = child.getAttribute('tempoelementid') ||
                        child.getAttribute('data-testid');
                    if (!codebaseId) {
                        continue;
                    }
                    child.setAttribute('tempoelementid', `${exports.DUPLICATE_PLACEHOLDER_PREFIX}${codebaseId}`);
                    child.setAttribute('data-testid', `${exports.DUPLICATE_PLACEHOLDER_PREFIX}${codebaseId}`);
                    child.classList.remove(codebaseId);
                    child.classList.add(exports.DUPLICATE_PLACEHOLDER_PREFIX + codebaseId);
                    child.setAttribute(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true');
                    children.push(...Array.from(child.children));
                }
                // Add the clones node right after the found node
                item.insertAdjacentElement('afterend', clonedNode);
                sendNewNavTree = true;
                instantUpdateSuccessful = true;
            });
        });
    }
    else if (changeItem.type === changeLedgerTypes_1.ChangeType.CHANGE_TAG) {
        const changeFields = changeItem.changeFields;
        (0, jquery_1.default)(`.${changeFields.codebaseIdToChange}`).each((index, item) => {
            const $newElement = (0, jquery_1.default)('<' + changeFields.newTagName + '></' + changeFields.newTagName + '>');
            $newElement.attr(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true'); // So that the DOM tree refresh doesn't get triggered
            $newElement.attr(identifierUtils_1.TEMPO_DELETE_AFTER_REFRESH, 'true');
            const $item = (0, jquery_1.default)(item);
            // Copy all attributes from the original element to the new element
            jquery_1.default.each($item[0].attributes, function () {
                $newElement.attr(this.name, this.value);
            });
            $item.contents().clone(true, true).appendTo($newElement);
            // Add right before the cloned item so the unique path stays the same
            $item.before($newElement);
            // Hide the original item
            $item.addClass(identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS);
            $item.attr(identifierUtils_1.TEMPO_DO_NOT_SHOW_IN_NAV_UNTIL_REFRESH, 'true');
            sendNewNavTree = true;
            instantUpdateSuccessful = true;
        });
    }
    else if (changeItem.type === changeLedgerTypes_1.ChangeType.UNDO) {
        const { sendNewNavTree: _sendNewNavTree, instantUpdateSuccessful: _instantUpdateSuccessful, } = applyUndoChangeItemToDocument(parentPort, changeItem);
        sendNewNavTree = _sendNewNavTree;
        instantUpdateSuccessful = _instantUpdateSuccessful;
    }
    else if (changeItem.type === changeLedgerTypes_1.ChangeType.REDO) {
        const changeFields = changeItem.changeFields;
        const changeToRedo = changeFields.changeToRedo;
        if (changeLedgerTypes_1.CHANGE_TYPES_WITH_INSTANT_UNDO.includes(changeToRedo.type)) {
            const { sendNewNavTree: _sendNewNavTree, instantUpdateSuccessful: _instantUpdateSuccessful, } = (0, exports.applyChangeItemToDocument)(parentPort, storyboardId, changeToRedo);
            sendNewNavTree = _sendNewNavTree;
            instantUpdateSuccessful = _instantUpdateSuccessful;
            if (changeToRedo.prevIdToNewIdMap) {
                (0, exports.updateCodebaseIds)(parentPort, changeToRedo.prevIdToNewIdMap, true);
            }
        }
    }
    // Immediately set the new selected element keys to prevent any delay in the outlines updating
    let elementKeyToSelectAfterInstantUpdate = changeItem.getElementKeyToSelectAfterInstantUpdate();
    let elementKeysToMultiselectAfterInstantUpdate = changeItem.getElementKeysToMultiselectAfterInstantUpdate();
    if (changeItem.type === changeLedgerTypes_1.ChangeType.UNDO) {
        elementKeyToSelectAfterInstantUpdate = changeItem.changeFields.changeToUndo.getElementKeyToSelectAfterUndoInstantUpdate();
        elementKeysToMultiselectAfterInstantUpdate = changeItem.changeFields.changeToUndo.getElementKeysToMultiselectAfterUndoInstantUpdate();
    }
    if (elementKeyToSelectAfterInstantUpdate !== undefined) {
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY, elementKeyToSelectAfterInstantUpdate);
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
            elementKey: elementKeyToSelectAfterInstantUpdate,
            outerHTML: (_a = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${elementKeyToSelectAfterInstantUpdate}`).get(0)) === null || _a === void 0 ? void 0 : _a.outerHTML,
        });
    }
    if (elementKeysToMultiselectAfterInstantUpdate !== undefined) {
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS, elementKeysToMultiselectAfterInstantUpdate);
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.MULTI_SELECTED_ELEMENT_KEYS,
            elementKeys: elementKeysToMultiselectAfterInstantUpdate,
            outerHTMLs: elementKeysToMultiselectAfterInstantUpdate === null || elementKeysToMultiselectAfterInstantUpdate === void 0 ? void 0 : elementKeysToMultiselectAfterInstantUpdate.map((elementKey) => { var _a; return (_a = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${elementKey}`).get(0)) === null || _a === void 0 ? void 0 : _a.outerHTML; }),
        });
    }
    if (instantUpdateSuccessful) {
        // Delete any elements that need to be deleted after instant updates
        (0, jquery_1.default)(`*[${identifierUtils_1.TEMPO_DELETE_AFTER_INSTANT_UPDATE}=true]`).remove();
    }
    parentPort.postMessage({
        id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.INSTANT_UPDATE_DONE,
        changeItem: plainChangeItem,
        instantUpdateData: extraInstantUpdateData,
        instantUpdateSuccessful,
    });
    return { sendNewNavTree, instantUpdateSuccessful };
};
exports.applyChangeItemToDocument = applyChangeItemToDocument;
const applyUndoChangeItemToDocument = (parentPort, changeItem) => {
    const changeFields = changeItem.changeFields;
    const changeToUndo = changeFields.changeToUndo;
    if (!changeLedgerTypes_1.CHANGE_TYPES_WITH_INSTANT_UNDO.includes(changeToUndo.type)) {
        return { sendNewNavTree: false, instantUpdateSuccessful: false };
    }
    let sendNewNavTree = false;
    let instantUpdateSuccessful = false;
    // API has completed and the IDs have been updated, reverse this change
    if (changeToUndo.prevIdToNewIdMap) {
        const undoCodebaseIdChanges = {};
        Object.keys(changeToUndo.prevIdToNewIdMap).forEach((prevId) => {
            const newId = changeToUndo.prevIdToNewIdMap[prevId];
            undoCodebaseIdChanges[newId] = prevId;
        });
        // If undoing do not update the codebase IDs backwards if there are codebase IDs to set after
        // the undo instant update is done
        const selectedElementSpecifiedAfterUndo = changeToUndo.getElementKeyToSelectAfterUndoInstantUpdate() !== undefined;
        (0, exports.updateCodebaseIds)(parentPort, undoCodebaseIdChanges, !selectedElementSpecifiedAfterUndo);
    }
    // Then undo the actual change
    if (changeToUndo.type === changeLedgerTypes_1.ChangeType.REMOVE_JSX) {
        // Re-add the removed JSX
        const innerChangeFields = changeToUndo.changeFields;
        const codebaseIdsToReadd = innerChangeFields.codebaseIdsToRemove;
        // If it has been flushed, re-create the html elements from the saved inner HTML
        if (changeFields.matchingActivityFlushed) {
            const instantUpdateData = changeToUndo.getInstantUpdateData();
            const parentToElementKeysRemoved = instantUpdateData.parentToElementKeysRemoved || {};
            Object.entries(parentToElementKeysRemoved).forEach(([parentElementKey, itemsRemoved]) => {
                // Sort the removed entries in order of unique path
                const sortedItemsRemoved = Object.values(itemsRemoved).sort((a, b) => {
                    const aElementKey = tempoElement_1.TempoElement.fromKey(a.elementKeyRemoved);
                    const bElementKey = tempoElement_1.TempoElement.fromKey(b.elementKeyRemoved);
                    return aElementKey.uniquePath.localeCompare(bElementKey.uniquePath);
                });
                // Find the parent element
                const parentElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${parentElementKey}`).get(0);
                if (parentElement) {
                    // Add the removed elements back in order
                    sortedItemsRemoved.forEach((item) => {
                        const { elementKeyRemoved, outerHTML } = item;
                        const element = tempoElement_1.TempoElement.fromKey(elementKeyRemoved);
                        const indexInParent = Number(element.uniquePath.split('-').pop());
                        const newElementFromHtml = (0, jquery_1.default)(outerHTML).get(0);
                        // Add to the parent in the index
                        if (newElementFromHtml) {
                            newElementFromHtml.setAttribute(identifierUtils_1.TEMPO_DELETE_AFTER_REFRESH, 'true');
                            newElementFromHtml.setAttribute(identifierUtils_1.TEMPO_INSTANT_UPDATE, 'true');
                            parentElement.insertBefore(newElementFromHtml, parentElement.children[indexInParent] || null);
                            instantUpdateSuccessful = true;
                            sendNewNavTree = true;
                        }
                    });
                }
            });
        }
        else {
            // Not flushed yet so can just re-add
            codebaseIdsToReadd.forEach((codebaseIdToReadd) => {
                (0, jquery_1.default)(`.${codebaseIdToReadd}`).each((index, item) => {
                    item.classList.remove(identifierUtils_1.TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS);
                    item.removeAttribute(identifierUtils_1.TEMPO_DO_NOT_SHOW_IN_NAV_UNTIL_REFRESH);
                    sendNewNavTree = true;
                    instantUpdateSuccessful = true;
                });
            });
        }
    }
    else if (changeToUndo.type === changeLedgerTypes_1.ChangeType.ADD_CLASS ||
        changeToUndo.type === changeLedgerTypes_1.ChangeType.STYLING) {
        const instantUpdateData = changeToUndo.getInstantUpdateData();
        const innerChangeFields = changeToUndo.changeFields;
        const addedClass = instantUpdateData === null || instantUpdateData === void 0 ? void 0 : instantUpdateData.addedClass;
        if (addedClass) {
            (0, jquery_1.default)(`.${innerChangeFields.codebaseIdToAddClass}`).each((index, item) => {
                if ((0, jquery_1.default)(item).hasClass(addedClass)) {
                    (0, jquery_1.default)(item).removeClass(addedClass);
                    instantUpdateSuccessful = true;
                }
            });
        }
        const codebaseAddedClass = instantUpdateData === null || instantUpdateData === void 0 ? void 0 : instantUpdateData.codebaseAddedClass;
        if (codebaseAddedClass) {
            (0, jquery_1.default)(`.${innerChangeFields.codebaseIdToAddClass}`).each((index, item) => {
                if ((0, jquery_1.default)(item).hasClass(codebaseAddedClass)) {
                    (0, jquery_1.default)(item).removeClass(codebaseAddedClass);
                    instantUpdateSuccessful = true;
                }
            });
        }
    }
    else if (changeToUndo.type === changeLedgerTypes_1.ChangeType.ADD_JSX) {
        const instantUpdateData = changeToUndo.getInstantUpdateData();
        const addedIds = instantUpdateData === null || instantUpdateData === void 0 ? void 0 : instantUpdateData.addedIds;
        addedIds === null || addedIds === void 0 ? void 0 : addedIds.forEach((addedId) => {
            (0, jquery_1.default)(`.${addedId}`).remove();
            instantUpdateSuccessful = true;
        });
        sendNewNavTree = true;
    }
    return { sendNewNavTree, instantUpdateSuccessful };
};
/**
 * After a change is processed on the backend, we need to update the codebase ids in the document.
 */
const updateCodebaseIds = (parentPort, prevIdToNewIdMap, updateElementKeys) => {
    // Update codebase ids in the document
    const changes = [];
    Object.entries(prevIdToNewIdMap).forEach(([prevCodebaseId, newCodebaseId]) => {
        (0, jquery_1.default)(`.${prevCodebaseId}`).each((index, item) => {
            changes.push({
                item,
                prevCodebaseId,
                newCodebaseId,
            });
        });
    });
    // Codebase Ids can swap, so we have to apply the changes after looking all elements up
    changes.forEach((change) => {
        const $item = (0, jquery_1.default)(change.item);
        const newClass = ($item.attr('class') || '').replace(new RegExp(`${change.prevCodebaseId}`, 'g'), change.newCodebaseId);
        $item.attr('class', newClass);
        change.item.setAttribute('tempoelementid', change.newCodebaseId);
        change.item.setAttribute('data-testid', change.newCodebaseId);
    });
    if (!updateElementKeys) {
        return Boolean(changes.length);
    }
    const keysToCheck = [
        {
            key: sessionStorageUtils_1.SELECTED_ELEMENT_KEY,
            messageId: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.SELECTED_ELEMENT_KEY,
        },
        {
            key: sessionStorageUtils_1.HOVERED_ELEMENT_KEY,
            messageId: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.HOVERED_ELEMENT_KEY,
        },
    ];
    keysToCheck.forEach(({ key, messageId }) => {
        var _a;
        const elementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(key);
        const tempoElement = tempoElement_1.TempoElement.fromKey(elementKey);
        if (prevIdToNewIdMap[tempoElement.codebaseId]) {
            const newElement = new tempoElement_1.TempoElement(prevIdToNewIdMap[tempoElement.codebaseId], tempoElement.storyboardId, tempoElement.uniquePath);
            (0, sessionStorageUtils_1.setMemoryStorageItem)(key, newElement.getKey());
            parentPort.postMessage({
                id: messageId,
                elementKey: newElement.getKey(),
                outerHTML: (_a = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${newElement.getKey()}`).get(0)) === null || _a === void 0 ? void 0 : _a.outerHTML,
            });
        }
    });
    // Also update the multiselected element keys
    const multiselectedElementKeys = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS);
    if (multiselectedElementKeys === null || multiselectedElementKeys === void 0 ? void 0 : multiselectedElementKeys.length) {
        const newMultiselectedElementKeys = [];
        multiselectedElementKeys.forEach((elementKey) => {
            const tempoElement = tempoElement_1.TempoElement.fromKey(elementKey);
            if (prevIdToNewIdMap[tempoElement.codebaseId]) {
                const newElement = new tempoElement_1.TempoElement(prevIdToNewIdMap[tempoElement.codebaseId], tempoElement.storyboardId, tempoElement.uniquePath);
                newMultiselectedElementKeys.push(newElement.getKey());
            }
            else {
                newMultiselectedElementKeys.push(elementKey);
            }
        });
        (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS, newMultiselectedElementKeys);
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.MULTI_SELECTED_ELEMENT_KEYS,
            elementKeys: newMultiselectedElementKeys,
            outerHTMLs: newMultiselectedElementKeys === null || newMultiselectedElementKeys === void 0 ? void 0 : newMultiselectedElementKeys.map((elementKey) => { var _a; return (_a = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${elementKey}`).get(0)) === null || _a === void 0 ? void 0 : _a.outerHTML; }),
        });
    }
    return Boolean(changes.length);
};
exports.updateCodebaseIds = updateCodebaseIds;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlSXRlbUZ1bmN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jaGFubmVsTWVzc2FnaW5nL2NoYW5nZUl0ZW1GdW5jdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0RBQXVCO0FBQ3ZCLHVEQVkyQjtBQUMzQiwyREFtQjZCO0FBQzdCLDJEQUc2QjtBQUM3QixpREFBa0Q7QUFDbEQsK0RBTStCO0FBQy9CLGlEQUE4QztBQUM5QywrQkFBb0M7QUFFcEMsMkNBQTJDO0FBQzlCLFFBQUEsbUNBQW1DLEdBQzlDLCtCQUErQixDQUFDO0FBQ3JCLFFBQUEsNEJBQTRCLEdBQUcsOEJBQThCLENBQUM7QUFDOUQsUUFBQSxjQUFjLEdBQUcsNEJBQTRCLENBQUM7QUFFM0Qsa0ZBQWtGO0FBQ2xGLHdEQUF3RDtBQUN4RCxzRUFBc0U7QUFDekQsUUFBQSw4QkFBOEIsR0FBRyxnQ0FBZ0MsQ0FBQztBQUVsRSxRQUFBLDRCQUE0QixHQUFHLG9CQUFvQixDQUFDO0FBRWpFLE1BQU0saUNBQWlDLEdBQUcsQ0FBQyxXQUFtQixFQUFVLEVBQUU7SUFDeEUsSUFBSSxrQkFBa0IsR0FBUSxJQUFJLENBQUM7SUFDbkMsSUFBSSxnQkFBZ0IsR0FBRyxRQUFRLENBQUM7SUFDaEMsSUFBQSxnQkFBQyxFQUFDLGNBQWMsV0FBVyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFVLEVBQUUsT0FBWSxFQUFFLEVBQUU7UUFDL0QsSUFBSSxJQUFBLGdCQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxHQUFHLGdCQUFnQixFQUFFO1lBQ2xELGdCQUFnQixHQUFHLElBQUEsZ0JBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDL0Msa0JBQWtCLEdBQUcsSUFBQSx1Q0FBcUIsRUFBQyxPQUFPLENBQUMsQ0FBQztTQUNyRDtJQUNILENBQUMs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eSc7XG5pbXBvcnQge1xuICBURU1QT19ERUxFVEVfQUZURVJfUkVGUkVTSCxcbiAgVEVNUE9fRE9fTk9UX1NIT1dfSU5fTkFWX1VOVElMX1JFRlJFU0gsXG4gIFRFTVBPX0lOU1RBTlRfVVBEQVRFLFxuICBURU1QT19JTlNUQU5UX1VQREFURV9TVFlMSU5HX1BSRUZJWCxcbiAgVEVNUE9fRElTUExBWV9OT05FX1VOVElMX1JFRlJFU0hfQ0xBU1MsXG4gIGdldENvZGViYXNlSWRGcm9tTm9kZSxcbiAgZ2V0RWxlbWVudEtleUZyb21Ob2RlLFxuICBFTEVNRU5UX0tFWV9QUkVGSVgsXG4gIFRFTVBPX0VMRU1FTlRfSUQsXG4gIFRFTVBPX0RFTEVURV9BRlRFUl9JTlNUQU5UX1VQREFURSxcbiAgVEVNUE9fT1VUTElORV9VTlRJTF9SRUZFU0gsXG59IGZyb20gJy4vaWRlbnRpZmllclV0aWxzJztcbmltcG9ydCB7XG4gIEFkZENsYXNzQ2hhbmdlLFxuICBBZGRDbGFzc0NoYW5nZUZpZWxkcyxcbiAgQWRkSnN4Q2hhbmdlLFxuICBBbnlDaGFuZ2VMZWRnZXJJdGVtLFxuICBDSEFOR0VfVFlQRVNfV0lUSF9JTlNUQU5UX1VORE8sXG4gIENoYW5nZVRhZ0NoYW5nZUZpZWxkcyxcbiAgQ2hhbmdlVHlwZSxcbiAgRHVwbGljYXRlQ2hhbmdlRmllbGRzLFxuICBNb3ZlSnN4Q2hhbmdlLFxuICBSZWRvQ2hhbmdlRmllbGRzLFxuICBSZW1vdmVDbGFzc0NoYW5nZUZpZWxkcyxcbiAgUmVtb3ZlSnN4Q2hhbmdlLFxuICBSZW1vdmVKc3hDaGFuZ2VGaWVsZHMsXG4gIFN0eWxpbmdDaGFuZ2VGaWVsZHMsXG4gIFVuZG9DaGFuZ2UsXG4gIFVuZG9DaGFuZ2VGaWVsZHMsXG4gIFdyYXBEaXZDaGFuZ2VGaWVsZHMsXG4gIHJlY29uc3RydWN0Q2hhbmdlTGVkZ2VyQ2xhc3MsXG59IGZyb20gJy4vY2hhbmdlTGVkZ2VyVHlwZXMnO1xuaW1wb3J0IHtcbiAgREVMRVRFX1NUWUxFX0NPTlNUQU5ULFxuICBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMsXG59IGZyb20gJy4vY29uc3RhbnRzQW5kVHlwZXMnO1xuaW1wb3J0IHsgY2FtZWxUb1NuYWtlQ2FzZSB9IGZyb20gJy4vY3NzUnVsZVV0aWxzJztcbmltcG9ydCB7XG4gIEhPVkVSRURfRUxFTUVOVF9LRVksXG4gIE1VTFRJX1NFTEVDVEVEX0VMRU1FTlRfS0VZUyxcbiAgU0VMRUNURURfRUxFTUVOVF9LRVksXG4gIGdldE1lbW9yeVN0b3JhZ2VJdGVtLFxuICBzZXRNZW1vcnlTdG9yYWdlSXRlbSxcbn0gZnJvbSAnLi9zZXNzaW9uU3RvcmFnZVV0aWxzJztcbmltcG9ydCB7IFRlbXBvRWxlbWVudCB9IGZyb20gJy4vdGVtcG9FbGVtZW50JztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuXG4vLyBUaGVzZSBjb25zdGFudHMgbWF0Y2ggd2hhdCB0ZW1wby1hcGkgaGFzXG5leHBvcnQgY29uc3QgV1JBUF9JTl9ESVZfUExBQ0VIT0xERVJfQ09ERUJBU0VfSUQgPVxuICAndGVtcG8td3JhcC1pbi1kaXYtcGxhY2Vob2xkZXInO1xuZXhwb3J0IGNvbnN0IERVUExJQ0FURV9QTEFDRUhPTERFUl9QUkVGSVggPSAndGVtcG8tZHVwbGljYXRlLXBsYWNlaG9sZGVyLSc7XG5leHBvcnQgY29uc3QgQUREX0pTWF9QUkVGSVggPSAndGVtcG8tYWRkLWpzeC1wbGFjZWhvbGRlci0nO1xuXG4vLyBTdG9yZWQgaW4gbWVtb3J5IHN0b3JhZ2UsIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBzb21lIHBvc3NpYmxlIGFkZCBjbGFzcyBpbnN0YW50XG4vLyB1cGRhdGVzIHRoYXQgbmVlZCB0byBiZSByZS1hcHBsaWVkIGFmdGVyIGEgaG90IHJlbG9hZFxuLy8gKGUuZy4gd2hlbiB0aGUgYWRkaXRpb25hbCkgaW5zdGFudCB1cGRhdGVzIGhhcHBlbmVkIGR1cmluZyBmbHVzaGluZ1xuZXhwb3J0IGNvbnN0IEFERF9DTEFTU19JTlNUQU5UX1VQREFURV9RVUVVRSA9ICdBRERfQ0xBU1NfSU5TVEFOVF9VUERBVEVfUVVFVUUnO1xuXG5leHBvcnQgY29uc3QgVEVNUE9SQVJZX1NUWUxJTkdfQ0xBU1NfTkFNRSA9ICdhcmI4OS10ZW1wLXN0eWxpbmcnO1xuXG5jb25zdCBnZXRUb3BMZXZlbENvZGViYXNlSWRGb3JDb21wb25lbnQgPSAoY29tcG9uZW50SWQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIGxldCB0b3BMZXZlbENvZGViYXNlSWQ6IGFueSA9IG51bGw7XG4gIGxldCBtaW5OdW1iZXJQYXJlbnRzID0gSW5maW5pdHk7XG4gICQoYC5jb21wb25lbnQtJHtjb21wb25lbnRJZH1gKS5lYWNoKChpbmRleDogYW55LCBlbGVtZW50OiBhbnkpID0+IHtcbiAgICBpZiAoJChlbGVtZW50KS5wYXJlbnRzKCkubGVuZ3RoIDwgbWluTnVtYmVyUGFyZW50cykge1xuICAgICAgbWluTnVtYmVyUGFyZW50cyA9ICQoZWxlbWVudCkucGFyZW50cygpLmxlbmd0aDtcbiAgICAgIHRvcExldmVsQ29kZWJhc2VJZCA9IGdldENvZGViYXNlSWRGcm9tTm9kZShlbGVtZW50KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB0b3BMZXZlbENvZGViYXNlSWQ7XG59O1xuXG5jb25zdCBtYWtlaWQgPSAobGVuZ3RoOiBudW1iZXIpOiBzdHJpbmcgPT4ge1xuICBsZXQgcmVzdWx0ID0gJyc7XG4gIGNvbnN0IGNoYXJhY3RlcnMgPVxuICAgICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSc7XG4gIGNvbnN0IGNoYXJhY3RlcnNMZW5ndGggPSBjaGFyYWN0ZXJzLmxlbmd0aDtcbiAgbGV0IGNvdW50ZXIgPSAwO1xuICB3aGlsZSAoY291bnRlciA8IGxlbmd0aCkge1xuICAgIHJlc3VsdCArPSBjaGFyYWN0ZXJzLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFyYWN0ZXJzTGVuZ3RoKSk7XG4gICAgY291bnRlciArPSAxO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5jb25zdCBhZGRPckVkaXRDU1NSdWxlID0gKHNlbGVjdG9yOiBzdHJpbmcsIHJ1bGVzOiBzdHJpbmcsIGlkPzogc3RyaW5nKSA9PiB7XG4gIHZhciBzdHlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcblxuICBpZiAoaWQpIHtcbiAgICBjb25zdCBleGlzdGluZ0VsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKGV4aXN0aW5nRWxlbWVudCkge1xuICAgICAgZXhpc3RpbmdFbGVtZW50LnJlbW92ZSgpO1xuICAgIH1cblxuICAgIHN0eWxlRWwuaWQgPSBpZDtcbiAgfVxuXG4gIC8vIEFwcGVuZCA8c3R5bGU+IGVsZW1lbnQgdG8gPGhlYWQ+XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG5cbiAgdmFyIHN0eWxlU2hlZXQ6IGFueSA9IHN0eWxlRWwuc2hlZXQ7XG5cbiAgaWYgKHN0eWxlU2hlZXQuaW5zZXJ0UnVsZSkge1xuICAgIC8vIEFsbCBicm93c2VycywgZXhjZXB0IElFIGJlZm9yZSB2ZXJzaW9uIDlcbiAgICBzdHlsZVNoZWV0Lmluc2VydFJ1bGUoXG4gICAgICBzZWxlY3RvciArICd7JyArIHJ1bGVzICsgJ30nLFxuICAgICAgc3R5bGVTaGVldC5jc3NSdWxlcy5sZW5ndGgsXG4gICAgKTtcbiAgfSBlbHNlIGlmIChzdHlsZVNoZWV0LmFkZFJ1bGUpIHtcbiAgICAvLyBJRSBiZWZvcmUgdmVyc2lvbiA5XG4gICAgc3R5bGVTaGVldC5hZGRSdWxlKHNlbGVjdG9yLCBydWxlcywgc3R5bGVTaGVldC5ydWxlcy5sZW5ndGgpO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgYXBwbHlDaGFuZ2VJdGVtVG9Eb2N1bWVudCA9IChcbiAgcGFyZW50UG9ydDogYW55LFxuICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbiAgcGxhaW5DaGFuZ2VJdGVtOiBBbnlDaGFuZ2VMZWRnZXJJdGVtLFxuKTogeyBzZW5kTmV3TmF2VHJlZTogYm9vbGVhbjsgaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWw6IGJvb2xlYW4gfSA9PiB7XG4gIGlmICghcGxhaW5DaGFuZ2VJdGVtIHx8ICFwbGFpbkNoYW5nZUl0ZW0udHlwZSkge1xuICAgIHJldHVybiB7IHNlbmROZXdOYXZUcmVlOiBmYWxzZSwgaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWw6IGZhbHNlIH07XG4gIH1cblxuICBjb25zdCBjaGFuZ2VJdGVtID0gcmVjb25zdHJ1Y3RDaGFuZ2VMZWRnZXJDbGFzcyhcbiAgICBwbGFpbkNoYW5nZUl0ZW0sXG4gICkgYXMgQW55Q2hhbmdlTGVkZ2VySXRlbTtcblxuICBsZXQgZXh0cmFJbnN0YW50VXBkYXRlRGF0YTogYW55ID0ge307XG4gIGxldCBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IGZhbHNlO1xuXG4gIC8vIFRoZSBkaXNwbGF5OiBub25lIHJ1bGUgaXMgbmVlZGVkIGZvciBhIGxvdCBvZiBpbnN0YW50IHVwZGF0ZXMsIHNvIGNyZWF0ZSBpdCBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gIGlmICghZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoVEVNUE9fRElTUExBWV9OT05FX1VOVElMX1JFRlJFU0hfQ0xBU1MpKSB7XG4gICAgYWRkT3JFZGl0Q1NTUnVsZShcbiAgICAgIGAuJHtURU1QT19ESVNQTEFZX05PTkVfVU5USUxfUkVGUkVTSF9DTEFTU31gLFxuICAgICAgJ2Rpc3BsYXk6IG5vbmUgIWltcG9ydGFudCcsXG4gICAgICBURU1QT19ESVNQTEFZX05PTkVfVU5USUxfUkVGUkVTSF9DTEFTUyxcbiAgICApO1xuICB9XG5cbiAgbGV0IHNlbmROZXdOYXZUcmVlID0gZmFsc2U7XG4gIGlmIChjaGFuZ2VJdGVtLnR5cGUgPT09IENoYW5nZVR5cGUuQUREX0pTWCkge1xuICAgIGNvbnN0IGNhc3RDaGFuZ2VJdGVtID0gY2hhbmdlSXRlbSBhcyBBZGRKc3hDaGFuZ2U7XG4gICAgY29uc3QgY2hhbmdlRmllbGRzID0gY2FzdENoYW5nZUl0ZW0uY2hhbmdlRmllbGRzO1xuXG4gICAgY29uc3QgbmV3QWRkZWRJZHMgPSBbXTtcblxuICAgIGlmIChjaGFuZ2VGaWVsZHMuaHRtbEZvckluc3RhbnRVcGRhdGUpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRUb0FkZCA9ICQoY2hhbmdlRmllbGRzLmh0bWxGb3JJbnN0YW50VXBkYXRlKTtcbiAgICAgIGVsZW1lbnRUb0FkZC5hdHRyKFRFTVBPX0RFTEVURV9BRlRFUl9SRUZSRVNILCAndHJ1ZScpO1xuICAgICAgZWxlbWVudFRvQWRkLmF0dHIoVEVNUE9fSU5TVEFOVF9VUERBVEUsICd0cnVlJyk7IC8vIFNvIHRoYXQgdGhlIERPTSB0cmVlIHJlZnJlc2ggZG9lc24ndCBnZXQgdHJpZ2dlcmVkXG4gICAgICBlbGVtZW50VG9BZGQuYXR0cihURU1QT19PVVRMSU5FX1VOVElMX1JFRkVTSCwgJ3RydWUnKTtcblxuICAgICAgY29uc3QgSURfRk9SX0VMRU1FTlQgPSBgJHtBRERfSlNYX1BSRUZJWH0ke3V1aWR2NCgpfWA7XG4gICAgICBlbGVtZW50VG9BZGQuYXR0cihURU1QT19FTEVNRU5UX0lELCBJRF9GT1JfRUxFTUVOVCk7XG4gICAgICBlbGVtZW50VG9BZGQuYWRkQ2xhc3MoSURfRk9SX0VMRU1FTlQpO1xuXG4gICAgICBuZXdBZGRlZElkcy5wdXNoKElEX0ZPUl9FTEVNRU5UKTtcblxuICAgICAgJChgLiR7Y2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb0FkZFRvfWApLmVhY2goKGluZGV4OiBhbnksIGl0ZW0pID0+IHtcbiAgICAgICAgaWYgKGNoYW5nZUZpZWxkcy5hZnRlckNvZGViYXNlSWQpIHtcbiAgICAgICAgICBjb25zdCBhZnRlckVsZW1lbnQgPSAkKGAuJHtjaGFuZ2VGaWVsZHMuYWZ0ZXJDb2RlYmFzZUlkfWApO1xuICAgICAgICAgIGlmICghYWZ0ZXJFbGVtZW50Py5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50VG9BZGQuaW5zZXJ0QWZ0ZXIoYWZ0ZXJFbGVtZW50LmZpcnN0KCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoYW5nZUZpZWxkcy5iZWZvcmVDb2RlYmFzZUlkKSB7XG4gICAgICAgICAgY29uc3QgYmVmb3JlRWxlbWVudCA9ICQoYC4ke2NoYW5nZUZpZWxkcy5iZWZvcmVDb2RlYmFzZUlkfWApO1xuICAgICAgICAgIGlmICghYmVmb3JlRWxlbWVudD8ubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsZW1lbnRUb0FkZC5pbnNlcnRCZWZvcmUoYmVmb3JlRWxlbWVudC5maXJzdCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkKGl0ZW0pLmFwcGVuZChlbGVtZW50VG9BZGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VuZE5ld05hdlRyZWUgPSB0cnVlO1xuICAgICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBleHRyYUluc3RhbnRVcGRhdGVEYXRhWyduZXdBZGRlZElkcyddID0gbmV3QWRkZWRJZHM7XG4gIH0gZWxzZSBpZiAoY2hhbmdlSXRlbS50eXBlID09PSBDaGFuZ2VUeXBlLk1PVkVfSlNYKSB7XG4gICAgY29uc3QgY2FzdENoYW5nZUl0ZW06IE1vdmVKc3hDaGFuZ2UgPSBjaGFuZ2VJdGVtIGFzIE1vdmVKc3hDaGFuZ2U7XG5cbiAgICAvLyBGaW5kIGVhY2ggZWxlbWVudCB0aGF0IG1hdGNoZXMgdGhlIGpzeENvZGViYXNlSWRcbiAgICBjb25zdCBzb3VyY2VFbGVtZW50czogSlF1ZXJ5PGFueT5bXSA9IFtdO1xuXG4gICAgLy8gU2VlIGlmIGRpcmVjdCBtYXRjaGVzIHdvcmsgZmlyc3RcbiAgICBpZiAoJChgLiR7Y2FzdENoYW5nZUl0ZW0uY2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb01vdmV9YCkubGVuZ3RoID4gMCkge1xuICAgICAgJChgLiR7Y2FzdENoYW5nZUl0ZW0uY2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb01vdmV9YCkuZWFjaChcbiAgICAgICAgKGluZGV4OiBhbnksIGVsZW1lbnQ6IGFueSkgPT4ge1xuICAgICAgICAgIHNvdXJjZUVsZW1lbnRzLnB1c2goJChlbGVtZW50KSk7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUcnkgdG8gZmluZCBpdCBieSB0aGUgY29tcG9uZW50IElEXG4gICAgICBsZXQgdG9wTGV2ZWxDb2RlYmFzZUlkID0gZ2V0VG9wTGV2ZWxDb2RlYmFzZUlkRm9yQ29tcG9uZW50KFxuICAgICAgICBjYXN0Q2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMuY29kZWJhc2VJZFRvTW92ZSB8fCAnJyxcbiAgICAgICk7XG5cbiAgICAgIGlmICh0b3BMZXZlbENvZGViYXNlSWQpIHtcbiAgICAgICAgJChgLiR7dG9wTGV2ZWxDb2RlYmFzZUlkfWApLmVhY2goKGluZGV4OiBhbnksIGVsZW1lbnQ6IGFueSkgPT4ge1xuICAgICAgICAgIHNvdXJjZUVsZW1lbnRzLnB1c2goJChlbGVtZW50KSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHRoZSBjb250YWluZXIgaXMgYSBjb21wb25lbnQsIGRyb3AgaW50byB0aGUgY29kZWJhc2VJZCBvZiB0aGUgdG9wLW1vc3QgY2hpbGQgZGl2XG4gICAgbGV0IGNvbnRhaW5lckNvZGViYXNlSWQgPVxuICAgICAgZ2V0VG9wTGV2ZWxDb2RlYmFzZUlkRm9yQ29tcG9uZW50KFxuICAgICAgICBjYXN0Q2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMuY29kZWJhc2VJZFRvTW92ZVRvIHx8ICcnLFxuICAgICAgKSB8fCBjYXN0Q2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMuY29kZWJhc2VJZFRvTW92ZVRvO1xuXG4gICAgLy8gRm9yIGVhY2ggc291cmNlIGVsZW1lbnQsIGZpbmQgdGhlIG5ldyBtYXRjaGluZyBwYXJlbnQgZWxlbWVudFxuICAgIGNvbnN0IG5ld1BhcmVudEVsZW1lbnRzOiBhbnlbXSA9IFtdO1xuICAgIHNvdXJjZUVsZW1lbnRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgIGxldCBuZXdQYXJlbnRFbGVtZW50ID0gbnVsbDtcblxuICAgICAgLy8gRm9yIGVhY2ggcGFyZW50LCB0cnkgdG8gc2VlIGlmIGl0IGVpdGhlciBtYXRjaGVzIG9yIGNvbnRhaW5zIHRoZSBuZXcgcGFyZW50XG4gICAgICBsZXQgcGFyZW50RWxlbWVudCA9IGVsZW1lbnQucGFyZW50KCk7XG4gICAgICB3aGlsZSAocGFyZW50RWxlbWVudC5sZW5ndGgpIHtcbiAgICAgICAgLy8gSWYgdGhlIHBhcmVudCBkaXJlY3RseSBtYXRjaGVzLCB0aGlzIGlzIGl0XG4gICAgICAgIGlmIChwYXJlbnRFbGVtZW50Lmhhc0NsYXNzKGNvbnRhaW5lckNvZGViYXNlSWQpKSB7XG4gICAgICAgICAgbmV3UGFyZW50RWxlbWVudCA9IHBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBjaGlsZHJlbiB0aGF0IG1hdGNoIHRoZSBjb2RlYmFzZSBJRCB0byBkcm9wIGludG9cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdDaGlsZHJlbiA9IHBhcmVudEVsZW1lbnQuZmluZChgLiR7Y29udGFpbmVyQ29kZWJhc2VJZH1gKTtcbiAgICAgICAgaWYgKG1hdGNoaW5nQ2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgLy8gVE9ETzogV2hhdCBpZiB0aGlzIG1hdGNoZXMgbW9yZSB0aGFuIG9uZT9cbiAgICAgICAgICBuZXdQYXJlbnRFbGVtZW50ID0gbWF0Y2hpbmdDaGlsZHJlbi5maXJzdCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyZW50RWxlbWVudCA9IHBhcmVudEVsZW1lbnQucGFyZW50KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghbmV3UGFyZW50RWxlbWVudCkge1xuICAgICAgICBuZXdQYXJlbnRFbGVtZW50cy5wdXNoKG51bGwpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIG5ld1BhcmVudEVsZW1lbnRzLnB1c2gobmV3UGFyZW50RWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICAvLyBGb3IgZWFjaCBjaGlsZC9wYXJlbnRFbGVtZW50IHBhaXIsIG1vdmUgdGhlIGNoaWxkIHRvIHRoZSBuZXcgcGFyZW50XG4gICAgc291cmNlRWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgY29uc3QgbmV3UGFyZW50RWxlbWVudCA9IG5ld1BhcmVudEVsZW1lbnRzW2luZGV4XTtcblxuICAgICAgaWYgKCFuZXdQYXJlbnRFbGVtZW50Lmxlbmd0aCkge1xuICAgICAgICBjb25zb2xlLmxvZygnQ291bGQgbm90IGZpbmQgbmV3IHBhcmVudCBlbGVtZW50IGZvciBpbnN0YW50IHVwZGF0ZScpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHNlbmROZXdOYXZUcmVlID0gdHJ1ZTtcbiAgICAgIGluc3RhbnRVcGRhdGVTdWNjZXNzZnVsID0gdHJ1ZTtcblxuICAgICAgZWxlbWVudC5hdHRyKFRFTVBPX0lOU1RBTlRfVVBEQVRFLCAndHJ1ZScpO1xuXG4gICAgICAvLyBJZiB0aGUgcGFyZW50IGhhc24ndCBjaGFuZ2VkLCBqdXN0IG1vdmUgaXQsIG90aGVyd2lzZSBjbG9uZSBpdCBhbmQgY3JlYXRlIGEgbmV3IG9uZSBpbiB0aGUgbmV3IHNwb3RcbiAgICAgIGxldCB1c2VDbG9uZSA9ICFuZXdQYXJlbnRFbGVtZW50LmlzKGVsZW1lbnQucGFyZW50KCkpO1xuXG4gICAgICAvLyBTbyB0aGF0IG5leHRqcyBob3QgcmVsb2FkaW5nIHdvcmtzLCBzaW1wbHkgaGlkZSB0aGUgZWxlbWVudCBhbmQgY2xvbmUgaXQgaW50byB0aGUgbmV3IHNwb3RcbiAgICAgIGxldCBjbG9uZUVsZW1lbnQ7XG4gICAgICBpZiAodXNlQ2xvbmUpIHtcbiAgICAgICAgY2xvbmVFbGVtZW50ID0gZWxlbWVudC5jbG9uZSgpO1xuICAgICAgICBjbG9uZUVsZW1lbnQuYXR0cihURU1QT19ERUxFVEVfQUZURVJfUkVGUkVTSCwgJ3RydWUnKTtcblxuICAgICAgICBlbGVtZW50LmFkZENsYXNzKFRFTVBPX0RJU1BMQVlfTk9ORV9VTlRJTF9SRUZSRVNIX0NMQVNTKTtcbiAgICAgICAgZWxlbWVudC5hdHRyKFRFTVBPX0RPX05PVF9TSE9XX0lOX05BVl9VTlRJTF9SRUZSRVNILCAndHJ1ZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2FzdENoYW5nZUl0ZW0uY2hhbmdlRmllbGRzLmFmdGVyQ29kZWJhc2VJZCkge1xuICAgICAgICBjb25zdCBhZnRlcklkVG9Vc2UgPVxuICAgICAgICAgIGdldFRvcExldmVsQ29kZWJhc2VJZEZvckNvbXBvbmVudChcbiAgICAgICAgICAgIGNhc3RDaGFuZ2VJdGVtLmNoYW5nZUZpZWxkcy5hZnRlckNvZGViYXNlSWQsXG4gICAgICAgICAgKSB8fCBjYXN0Q2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMuYWZ0ZXJDb2RlYmFzZUlkO1xuICAgICAgICBjb25zdCBhZnRlckVsZW1lbnQgPSBuZXdQYXJlbnRFbGVtZW50LmNoaWxkcmVuKGAuJHthZnRlcklkVG9Vc2V9YCk7XG4gICAgICAgIGlmIChhZnRlckVsZW1lbnQubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHVzZUNsb25lICYmIGNsb25lRWxlbWVudCkge1xuICAgICAgICAgICAgY2xvbmVFbGVtZW50Lmluc2VydEFmdGVyKGFmdGVyRWxlbWVudC5maXJzdCgpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5pbnNlcnRBZnRlcihhZnRlckVsZW1lbnQuZmlyc3QoKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjYXN0Q2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMuYmVmb3JlQ29kZWJhc2VJZCkge1xuICAgICAgICBjb25zdCBiZWZvcmVJZFRvVXNlID1cbiAgICAgICAgICBnZXRUb3BMZXZlbENvZGViYXNlSWRGb3JDb21wb25lbnQoXG4gICAgICAgICAgICBjYXN0Q2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMuYmVmb3JlQ29kZWJhc2VJZCxcbiAgICAgICAgICApIHx8IGNhc3RDaGFuZ2VJdGVtLmNoYW5nZUZpZWxkcy5iZWZvcmVDb2RlYmFzZUlkO1xuICAgICAgICBjb25zdCBiZWZvcmVFbGVtZW50ID0gbmV3UGFyZW50RWxlbWVudC5jaGlsZHJlbihgLiR7YmVmb3JlSWRUb1VzZX1gKTtcbiAgICAgICAgaWYgKGJlZm9yZUVsZW1lbnQubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHVzZUNsb25lICYmIGNsb25lRWxlbWVudCkge1xuICAgICAgICAgICAgY2xvbmVFbGVtZW50Lmluc2VydEJlZm9yZShiZWZvcmVFbGVtZW50LmZpcnN0KCkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50Lmluc2VydEJlZm9yZShiZWZvcmVFbGVtZW50LmZpcnN0KCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHVzZUNsb25lICYmIGNsb25lRWxlbWVudCkge1xuICAgICAgICBjbG9uZUVsZW1lbnQuYXBwZW5kVG8obmV3UGFyZW50RWxlbWVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50LmFwcGVuZFRvKG5ld1BhcmVudEVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2UgaWYgKGNoYW5nZUl0ZW0udHlwZSA9PT0gQ2hhbmdlVHlwZS5SRU1PVkVfSlNYKSB7XG4gICAgY29uc3QgY2FzdENoYW5nZUl0ZW06IFJlbW92ZUpzeENoYW5nZSA9IGNoYW5nZUl0ZW0gYXMgUmVtb3ZlSnN4Q2hhbmdlO1xuXG4gICAgY29uc3QgcGFyZW50VG9FbGVtZW50S2V5c1JlbW92ZWQ6IGFueSA9IHt9O1xuXG4gICAgY2FzdENoYW5nZUl0ZW0uY2hhbmdlRmllbGRzLmNvZGViYXNlSWRzVG9SZW1vdmUuZm9yRWFjaChcbiAgICAgIChjb2RlYmFzZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgLy8gU2VlIGlmIGRpcmVjdCBtYXRjaGVzIHdvcmsgZmlyc3RcbiAgICAgICAgbGV0IGNvZGViYXNlSWRUb1JlbW92ZTtcbiAgICAgICAgaWYgKCQoYC4ke2NvZGViYXNlSWR9YCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNvZGViYXNlSWRUb1JlbW92ZSA9IGNvZGViYXNlSWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gVHJ5IHRvIGZpbmQgaXQgYnkgdGhlIGNvbXBvbmVudCBJRFxuICAgICAgICAgIGxldCB0b3BMZXZlbENvZGViYXNlSWQgPSBnZXRUb3BMZXZlbENvZGViYXNlSWRGb3JDb21wb25lbnQoXG4gICAgICAgICAgICBjb2RlYmFzZUlkIHx8ICcnLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAoIXRvcExldmVsQ29kZWJhc2VJZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0NvdWxkIG5vdCBmaW5kIGNvbXBvbmVudCBlbGVtZW50IGZvciBpbnN0YW50IHVwZGF0ZScpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvZGViYXNlSWRUb1JlbW92ZSA9IHRvcExldmVsQ29kZWJhc2VJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvciBlYWNoIGl0ZW0gdGhhdCBpcyByZW1vdmVkLCBzYXZlIHRoZSBpbm5lciBIVE1MIGluIGNhc2UgaXQgZ2V0cyBkZWxldGVkIGFuZCB3ZSB3YW50IHRvIHVuZG9cbiAgICAgICAgJChgLiR7Y29kZWJhc2VJZFRvUmVtb3ZlfWApLmVhY2goKGluZGV4OiBhbnksIGl0ZW0pID0+IHtcbiAgICAgICAgICBjb25zdCBlbGVtZW50S2V5UmVtb3ZlZCA9IGdldEVsZW1lbnRLZXlGcm9tTm9kZShpdGVtKTtcbiAgICAgICAgICBjb25zdCBwYXJlbnRFbGVtZW50S2V5ID0gZ2V0RWxlbWVudEtleUZyb21Ob2RlKGl0ZW0ucGFyZW50RWxlbWVudCk7XG5cbiAgICAgICAgICBpZiAoZWxlbWVudEtleVJlbW92ZWQgJiYgcGFyZW50RWxlbWVudEtleSkge1xuICAgICAgICAgICAgaWYgKCFwYXJlbnRUb0VsZW1lbnRLZXlzUmVtb3ZlZFtwYXJlbnRFbGVtZW50S2V5XSkge1xuICAgICAgICAgICAgICBwYXJlbnRUb0VsZW1lbnRLZXlzUmVtb3ZlZFtwYXJlbnRFbGVtZW50S2V5XSA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJlbnRUb0VsZW1lbnRLZXlzUmVtb3ZlZFtwYXJlbnRFbGVtZW50S2V5XS5wdXNoKHtcbiAgICAgICAgICAgICAgb3V0ZXJIVE1MOiBpdGVtLm91dGVySFRNTCxcbiAgICAgICAgICAgICAgZWxlbWVudEtleVJlbW92ZWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoVEVNUE9fRElTUExBWV9OT05FX1VOVElMX1JFRlJFU0hfQ0xBU1MpO1xuICAgICAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKFRFTVBPX0RPX05PVF9TSE9XX0lOX05BVl9VTlRJTF9SRUZSRVNILCAndHJ1ZScpO1xuXG4gICAgICAgICAgc2VuZE5ld05hdlRyZWUgPSB0cnVlO1xuICAgICAgICAgIGluc3RhbnRVcGRhdGVTdWNjZXNzZnVsID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG5cbiAgICBleHRyYUluc3RhbnRVcGRhdGVEYXRhLnBhcmVudFRvRWxlbWVudEtleXNSZW1vdmVkID1cbiAgICAgIHBhcmVudFRvRWxlbWVudEtleXNSZW1vdmVkO1xuICB9IGVsc2UgaWYgKFxuICAgIGNoYW5nZUl0ZW0udHlwZSA9PT0gQ2hhbmdlVHlwZS5BRERfQ0xBU1MgfHxcbiAgICBjaGFuZ2VJdGVtLnR5cGUgPT09IENoYW5nZVR5cGUuU1RZTElOR1xuICApIHtcbiAgICBsZXQgY2xhc3NOYW1lLFxuICAgICAgY3NzRXF1aXZhbGVudCxcbiAgICAgIGNvZGViYXNlSWRUb0FkZENsYXNzLFxuICAgICAgdGVtcG9yYXJ5Q2xhc3MsXG4gICAgICBjb2RlYmFzZUNsYXNzTmFtZSxcbiAgICAgIG1vZGlmaWVycztcblxuICAgIGlmIChjaGFuZ2VJdGVtLnR5cGUgPT09IENoYW5nZVR5cGUuQUREX0NMQVNTKSB7XG4gICAgICBjb25zdCBjYXN0Q2hhbmdlSXRlbTogQWRkQ2xhc3NDaGFuZ2UgPSBjaGFuZ2VJdGVtIGFzIEFkZENsYXNzQ2hhbmdlO1xuICAgICAgY29kZWJhc2VDbGFzc05hbWUgPSBjYXN0Q2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMuY2xhc3NOYW1lO1xuICAgICAgY2xhc3NOYW1lID0gY2FzdENoYW5nZUl0ZW0uY2hhbmdlRmllbGRzLmNsYXNzTmFtZTtcbiAgICAgIGNzc0VxdWl2YWxlbnQgPSBjYXN0Q2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMuY3NzRXF1aXZhbGVudDtcbiAgICAgIGNvZGViYXNlSWRUb0FkZENsYXNzID0gY2FzdENoYW5nZUl0ZW0uY2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb0FkZENsYXNzO1xuICAgICAgdGVtcG9yYXJ5Q2xhc3MgPSBjYXN0Q2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMudGVtcG9yYXJ5T25seTtcbiAgICAgIG1vZGlmaWVycyA9IGNhc3RDaGFuZ2VJdGVtLmNoYW5nZUZpZWxkcy5tb2RpZmllcnM7XG4gICAgICBpZiAodGVtcG9yYXJ5Q2xhc3MpIHtcbiAgICAgICAgY2xhc3NOYW1lID0gVEVNUE9SQVJZX1NUWUxJTkdfQ0xBU1NfTkFNRTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQXMgb2YgTWFyY2ggNiwgMjAyNCB3ZSBvbmx5IHN1cHBvcnQgdGFpbHdpbmQgU1RZTElORyBjaGFuZ2VzLCBzbyB0cmVhdCB0aGVtIGFzIGFkZGluZyBhIGNsYXNzXG4gICAgICBjb25zdCBjYXN0Q2hhbmdlSXRlbTogU3R5bGluZ0NoYW5nZUZpZWxkcyA9XG4gICAgICAgIGNoYW5nZUl0ZW0uY2hhbmdlRmllbGRzIGFzIFN0eWxpbmdDaGFuZ2VGaWVsZHM7XG4gICAgICBjbGFzc05hbWUgPSAnJztcbiAgICAgIGNzc0VxdWl2YWxlbnQgPSBPYmplY3Qua2V5cyhjYXN0Q2hhbmdlSXRlbS5zdHlsaW5nQ2hhbmdlcylcbiAgICAgICAgLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgICAgaWYgKGNhc3RDaGFuZ2VJdGVtLnN0eWxpbmdDaGFuZ2VzW2tleV0gPT09IERFTEVURV9TVFlMRV9DT05TVEFOVCkge1xuICAgICAgICAgICAgcmV0dXJuIGAke2NhbWVsVG9TbmFrZUNhc2Uoa2V5KX06IHVuc2V0ICFpbXBvcnRhbnQ7YDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gYCR7Y2FtZWxUb1NuYWtlQ2FzZShrZXkpfTogJHtcbiAgICAgICAgICAgIGNhc3RDaGFuZ2VJdGVtLnN0eWxpbmdDaGFuZ2VzW2tleV1cbiAgICAgICAgICB9O2A7XG4gICAgICAgIH0pXG4gICAgICAgIC5qb2luKCcnKTtcbiAgICAgIGNvZGViYXNlSWRUb0FkZENsYXNzID0gY2FzdENoYW5nZUl0ZW0uY29kZWJhc2VJZDtcbiAgICAgIG1vZGlmaWVycyA9IGNhc3RDaGFuZ2VJdGVtLm1vZGlmaWVycztcbiAgICB9XG4gICAgY29uc3QgU0FGRV9DTEFTU05BTUVfUkVHRVggPSAvW15BLVphLXowLTlfLV0vZztcblxuICAgIC8vIEVzY2FwZSBhbnkgY3VzdG9tIGNsYXNzZXNcbiAgICBsZXQgY2xhc3NUb0FkZCA9IChjbGFzc05hbWUgfHwgJycpXG4gICAgICAucmVwbGFjZShTQUZFX0NMQVNTTkFNRV9SRUdFWCwgJy0nKSAvLyBSZXBsYWNlIGFueSBub24tYWxwaGFudW1lcmljIGNoYXJhY3RlcnMgd2l0aCAnLSdcbiAgICAgIC5yZXBsYWNlKC9eXFxkLywgJy0kJicpOyAvLyBJZiB0aGUgY2xhc3Mgc3RhcnRzIHdpdGggYSBkaWdpdCwgcHJlcGVuZCB3aXRoICctJ1xuXG4gICAgLy8gSW5zdGVhZCBvZiBhZGRpbmcgdGhlIGNsYXNzIG5hbWUsIGdlbmVyYXRlIGEgbmV3IGNsYXNzIGFuZCBzZXQgdGhlXG4gICAgLy8gY3NzIGVxdWl2YWxlbnQgdmFsdWVzIGluc2lkZSBpdFxuICAgIC8vIFRoaXMgY2xhc3Mgd2lsbCBiZSBkZWxldGVkIGFmdGVyIGEgaG90IHJlbG9hZFxuICAgIC8vIE5vdGUgLSBmb3IgdGVtcG9yYXJ5IGNsYXNzZXMgd2Ugd2FudCB0byBleHBsaWNpdGx5IHVzZSB0aGUgc2FtZSBjbGFzc1xuICAgIGlmIChjc3NFcXVpdmFsZW50ICYmICF0ZW1wb3JhcnlDbGFzcykge1xuICAgICAgY29uc3QgbXNTaW5jZUphbjEgPSBEYXRlLm5vdygpIC0gMTcwNDA2NzIwMDAwMDtcbiAgICAgIGNsYXNzVG9BZGQgPSBgJHtURU1QT19JTlNUQU5UX1VQREFURV9TVFlMSU5HX1BSRUZJWH0ke21zU2luY2VKYW4xfS0ke2NsYXNzVG9BZGR9YDtcbiAgICB9XG5cbiAgICBpZiAoY2xhc3NUb0FkZCkge1xuICAgICAgaWYgKCF0ZW1wb3JhcnlDbGFzcykge1xuICAgICAgICAvLyBDbGVhciB0aGUgdGVtcG9yYXJ5IGNsYXNzIG9uIHRoaXMgZWxlbWVudCBpZiBpdCBoYXMgaXRcbiAgICAgICAgJChgLiR7Y29kZWJhc2VJZFRvQWRkQ2xhc3N9YCkucmVtb3ZlQ2xhc3MoVEVNUE9SQVJZX1NUWUxJTkdfQ0xBU1NfTkFNRSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjc3NFcXVpdmFsZW50KSB7XG4gICAgICAgIGlmIChtb2RpZmllcnMgJiYgbW9kaWZpZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb25zdCBDU1NfUFNFVURPX01PRElGSUVSUyA9IFtcbiAgICAgICAgICAgICdob3ZlcicsXG4gICAgICAgICAgICAncmVxdWlyZWQnLFxuICAgICAgICAgICAgJ2ZvY3VzJyxcbiAgICAgICAgICAgICdhY3RpdmUnLFxuICAgICAgICAgICAgJ2ludmFsaWQnLFxuICAgICAgICAgICAgJ2Rpc2FibGVkJyxcbiAgICAgICAgICBdO1xuXG4gICAgICAgICAgY29uc3QgcHNldWRvTW9kaWZpZXJzID0gbW9kaWZpZXJzLmZpbHRlcigobW9kaWZpZXIpID0+XG4gICAgICAgICAgICBDU1NfUFNFVURPX01PRElGSUVSUy5pbmNsdWRlcyhtb2RpZmllciksXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zdCBwc2V1ZG9Nb2RpZmllcnNTdWZmaXggPSBwc2V1ZG9Nb2RpZmllcnMuam9pbignOicpO1xuXG4gICAgICAgICAgaWYgKHBzZXVkb01vZGlmaWVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBtb2RpZmllckNsYXNzID0gYCR7Y2xhc3NUb0FkZH06JHtwc2V1ZG9Nb2RpZmllcnNTdWZmaXh9YDtcbiAgICAgICAgICAgIGFkZE9yRWRpdENTU1J1bGUoYC4ke21vZGlmaWVyQ2xhc3N9YCwgY3NzRXF1aXZhbGVudCwgbW9kaWZpZXJDbGFzcyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFkZE9yRWRpdENTU1J1bGUoYC4ke2NsYXNzVG9BZGR9YCwgY3NzRXF1aXZhbGVudCwgY2xhc3NUb0FkZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgZm9yY2VDbGFzc2VzID0gbW9kaWZpZXJzXG4gICAgICAgICAgICAubWFwKChtb2RpZmllcikgPT4gYC50ZW1wby1mb3JjZS0ke21vZGlmaWVyfWApXG4gICAgICAgICAgICAuam9pbignJyk7XG4gICAgICAgICAgY29uc3QgaW5zdGFudFVwZGF0ZUZvckZvcmNlQ2xhc3MgPSBgJHtjbGFzc1RvQWRkfSR7Zm9yY2VDbGFzc2VzfWA7XG5cbiAgICAgICAgICBhZGRPckVkaXRDU1NSdWxlKFxuICAgICAgICAgICAgYC4ke2luc3RhbnRVcGRhdGVGb3JGb3JjZUNsYXNzfWAsXG4gICAgICAgICAgICBjc3NFcXVpdmFsZW50LFxuICAgICAgICAgICAgaW5zdGFudFVwZGF0ZUZvckZvcmNlQ2xhc3MsXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGRPckVkaXRDU1NSdWxlKGAuJHtjbGFzc1RvQWRkfWAsIGNzc0VxdWl2YWxlbnQsIGNsYXNzVG9BZGQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRBZGRDbGFzc1ZhbHVlcyA9XG4gICAgICAgIGdldE1lbW9yeVN0b3JhZ2VJdGVtKEFERF9DTEFTU19JTlNUQU5UX1VQREFURV9RVUVVRSkgfHwgW107XG5cbiAgICAgIC8vIFNlZSBpZiBkaXJlY3QgbWF0Y2hlcyB3b3JrIGZpcnN0XG4gICAgICBpZiAoJChgLiR7Y29kZWJhc2VJZFRvQWRkQ2xhc3N9YCkubGVuZ3RoID4gMCkge1xuICAgICAgICAkKGAuJHtjb2RlYmFzZUlkVG9BZGRDbGFzc31gKS5hZGRDbGFzcyhjbGFzc1RvQWRkKTtcblxuICAgICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG5cbiAgICAgICAgY3VycmVudEFkZENsYXNzVmFsdWVzLnB1c2goe1xuICAgICAgICAgIGNvZGViYXNlSWQ6IGNvZGViYXNlSWRUb0FkZENsYXNzLFxuICAgICAgICAgIGNsYXNzTmFtZTogY2xhc3NUb0FkZCxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUcnkgdG8gZmluZCBpdCBieSB0aGUgY29tcG9uZW50IElEXG4gICAgICAgIGxldCB0b3BMZXZlbENvZGViYXNlSWQgPSBnZXRUb3BMZXZlbENvZGViYXNlSWRGb3JDb21wb25lbnQoXG4gICAgICAgICAgY29kZWJhc2VJZFRvQWRkQ2xhc3MgfHwgJycsXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHRvcExldmVsQ29kZWJhc2VJZCAmJiAkKGAuJHt0b3BMZXZlbENvZGViYXNlSWR9YCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGluc3RhbnRVcGRhdGVTdWNjZXNzZnVsID0gdHJ1ZTtcbiAgICAgICAgICAkKGAuJHt0b3BMZXZlbENvZGViYXNlSWR9YCkuYWRkQ2xhc3MoY2xhc3NUb0FkZCk7XG5cbiAgICAgICAgICBjdXJyZW50QWRkQ2xhc3NWYWx1ZXMucHVzaCh7XG4gICAgICAgICAgICBjb2RlYmFzZUlkOiB0b3BMZXZlbENvZGViYXNlSWQsXG4gICAgICAgICAgICBjbGFzc05hbWU6IGNsYXNzVG9BZGQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oXG4gICAgICAgIEFERF9DTEFTU19JTlNUQU5UX1VQREFURV9RVUVVRSxcbiAgICAgICAgY3VycmVudEFkZENsYXNzVmFsdWVzLFxuICAgICAgKTtcblxuICAgICAgZXh0cmFJbnN0YW50VXBkYXRlRGF0YS5hZGRlZENsYXNzID0gY2xhc3NUb0FkZDtcbiAgICAgIGV4dHJhSW5zdGFudFVwZGF0ZURhdGEuY29kZWJhc2VBZGRlZENsYXNzID0gY29kZWJhc2VDbGFzc05hbWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKGNoYW5nZUl0ZW0udHlwZSA9PT0gQ2hhbmdlVHlwZS5SRU1PVkVfQ0xBU1MpIHtcbiAgICBjb25zdCByZW1vdmVDbGFzc0NoYW5nZUZpZWxkcyA9XG4gICAgICBjaGFuZ2VJdGVtLmNoYW5nZUZpZWxkcyBhcyBSZW1vdmVDbGFzc0NoYW5nZUZpZWxkcztcblxuICAgIC8vIFNlZSBpZiBkaXJlY3QgbWF0Y2hlcyB3b3JrIGZpcnN0XG4gICAgaWYgKCQoYC4ke3JlbW92ZUNsYXNzQ2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb1JlbW92ZUNsYXNzfWApLmxlbmd0aCA+IDApIHtcbiAgICAgICQoYC4ke3JlbW92ZUNsYXNzQ2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb1JlbW92ZUNsYXNzfWApLnJlbW92ZUNsYXNzKFxuICAgICAgICByZW1vdmVDbGFzc0NoYW5nZUZpZWxkcy5jbGFzc05hbWUsXG4gICAgICApO1xuXG4gICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRyeSB0byBmaW5kIGl0IGJ5IHRoZSBjb21wb25lbnQgSURcbiAgICAgIGxldCB0b3BMZXZlbENvZGViYXNlSWQgPSBnZXRUb3BMZXZlbENvZGViYXNlSWRGb3JDb21wb25lbnQoXG4gICAgICAgIHJlbW92ZUNsYXNzQ2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb1JlbW92ZUNsYXNzIHx8ICcnLFxuICAgICAgKTtcblxuICAgICAgaWYgKHRvcExldmVsQ29kZWJhc2VJZCAmJiAkKGAuJHt0b3BMZXZlbENvZGViYXNlSWR9YCkubGVuZ3RoID4gMCkge1xuICAgICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICAgICQoYC4ke3RvcExldmVsQ29kZWJhc2VJZH1gKS5yZW1vdmVDbGFzcyhcbiAgICAgICAgICByZW1vdmVDbGFzc0NoYW5nZUZpZWxkcy5jbGFzc05hbWUsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGNoYW5nZUl0ZW0udHlwZSA9PT0gQ2hhbmdlVHlwZS5XUkFQX0RJVikge1xuICAgIGNvbnN0IGNoYW5nZUZpZWxkcyA9IGNoYW5nZUl0ZW0uY2hhbmdlRmllbGRzIGFzIFdyYXBEaXZDaGFuZ2VGaWVsZHM7XG4gICAgY29uc3QgY29kZWJhc2VJZHNUb1dyYXAgPSBjaGFuZ2VGaWVsZHMuY29kZWJhc2VJZHNUb1dyYXA7XG5cbiAgICBjb25zdCBmaXJzdENvZGViYXNlSWQgPSBjb2RlYmFzZUlkc1RvV3JhcFswXTtcblxuICAgIC8vIFdlIGFzc3VtZSB0aGUgb3RoZXIgY29kZWJhc2UgSURzIGFyZSBzaWJsaW5ncyBvZiB0aGlzIGNvZGViYXNlIElELCBzbyB3ZVxuICAgIC8vIGZpbmQgZWFjaCBpbnN0YW5jZSBvZiB0aGUgZmlyc3Qgb25lIGFuZCBpbmNsdWRlIHRoZSBvdGhlciBpdGVtcyB0aGF0IG1hdGNoIGluIGl0XG4gICAgLy8gSWYgdGhlIG90aGVyIGl0ZW1zIGFyZW4ndCBhbGwgZm91bmQsIHdlIGRvIG5vdCB3cmFwIGFuZCBsZXQgaG90IHJlbG9hZCBoYW5kbGUgaXRcbiAgICAkKGAuJHtmaXJzdENvZGViYXNlSWR9YCkuZWFjaCgoaW5kZXg6IGFueSwgaXRlbSkgPT4ge1xuICAgICAgY29uc3Qgb3RoZXJDb2RlYmFzZUlkcyA9IGNvZGViYXNlSWRzVG9XcmFwLnNsaWNlKDEpO1xuICAgICAgLy8gRm9yIGVhY2ggY29kZWJhc2UgSUQgaW4gb3RoZXJDb2RlYmFzZUlkcywgcmV0cmlldmUgdGhlIGVsZW1lbnQgdGhhdCBpcyBhIHNpYmxpbmcgb2YgaXRlbVxuICAgICAgY29uc3Qgc2libGluZ3MgPSAkKGl0ZW0pLnNpYmxpbmdzKCk7XG4gICAgICBjb25zdCBhbGxJdGVtc1RvQWRkVG9OZXdEaXYgPSBbaXRlbV07XG5cbiAgICAgIGxldCBlYXJsaWVzdEl0ZW0gPSBpdGVtO1xuICAgICAgbGV0IGVhcmxpZXN0SW5kZXggPSAkKGl0ZW0pLmluZGV4KCk7XG5cbiAgICAgIG90aGVyQ29kZWJhc2VJZHMuZm9yRWFjaCgoY29kZWJhc2VJZCkgPT4ge1xuICAgICAgICBjb25zdCBmb3VuZFNpYmxpbmcgPSBzaWJsaW5ncy5maWx0ZXIoYC4ke2NvZGViYXNlSWR9YCkuZ2V0KDApO1xuICAgICAgICBpZiAoZm91bmRTaWJsaW5nKSB7XG4gICAgICAgICAgYWxsSXRlbXNUb0FkZFRvTmV3RGl2LnB1c2goZm91bmRTaWJsaW5nKTtcbiAgICAgICAgICBjb25zdCBpbmRleCA9ICQoZm91bmRTaWJsaW5nKS5pbmRleCgpO1xuICAgICAgICAgIGlmIChpbmRleCA8IGVhcmxpZXN0SW5kZXgpIHtcbiAgICAgICAgICAgIGVhcmxpZXN0SXRlbSA9IGZvdW5kU2libGluZztcbiAgICAgICAgICAgIGVhcmxpZXN0SW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBUT0RPOiBXaGF0IHRvIGRvIGlmIHRoZXkgYWxsIGNhbid0IGJlIGZvdW5kP1xuICAgICAgaWYgKGFsbEl0ZW1zVG9BZGRUb05ld0Rpdi5sZW5ndGggIT09IGNvZGViYXNlSWRzVG9XcmFwLmxlbmd0aCkge1xuICAgICAgICAvLyBGb3Igbm93LCBqdXN0IGFkZCB0aGUgb25lcyB0aGF0IHdlcmUgZm91bmRcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIGEgZGl2IHdpdGggYSBjbG9uZSBvZiB0aGUgaXRlbSwgd2hpbGUgaGlkaW5nIHRoZSBpdGVtXG4gICAgICAvLyBXaGVuIHRoZSBob3QgcmVsb2FkIGhhcHBlbnMgdGhlIGNsb25lIGdldHMgZGVsZXRlZCBhbmQgdGhlIGl0ZW0gaXMgc2hvd24gYWdhaW5cbiAgICAgIGNvbnN0IG5ld0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbmV3RGl2LmNsYXNzTmFtZSA9IFdSQVBfSU5fRElWX1BMQUNFSE9MREVSX0NPREVCQVNFX0lEO1xuICAgICAgbmV3RGl2LnNldEF0dHJpYnV0ZShURU1QT19JTlNUQU5UX1VQREFURSwgJ3RydWUnKTsgLy8gU28gdGhhdCB0aGUgRE9NIHRyZWUgcmVmcmVzaCBkb2Vzbid0IGdldCB0cmlnZ2VyZWRcbiAgICAgIG5ld0Rpdi5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICd0ZW1wb2VsZW1lbnRpZCcsXG4gICAgICAgIFdSQVBfSU5fRElWX1BMQUNFSE9MREVSX0NPREVCQVNFX0lELFxuICAgICAgKTtcbiAgICAgIG5ld0Rpdi5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGVzdGlkJywgV1JBUF9JTl9ESVZfUExBQ0VIT0xERVJfQ09ERUJBU0VfSUQpO1xuICAgICAgbmV3RGl2LnNldEF0dHJpYnV0ZShURU1QT19ERUxFVEVfQUZURVJfUkVGUkVTSCwgJ3RydWUnKTtcbiAgICAgIGFsbEl0ZW1zVG9BZGRUb05ld0Rpdi5mb3JFYWNoKChlbGVtKSA9PiB7XG4gICAgICAgIG5ld0Rpdi5hcHBlbmRDaGlsZChlbGVtLmNsb25lTm9kZSh0cnVlKSk7XG5cbiAgICAgICAgZWxlbS5jbGFzc0xpc3QuYWRkKFRFTVBPX0RJU1BMQVlfTk9ORV9VTlRJTF9SRUZSRVNIX0NMQVNTKTtcbiAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoVEVNUE9fRE9fTk9UX1NIT1dfSU5fTkFWX1VOVElMX1JFRlJFU0gsICd0cnVlJyk7XG4gICAgICB9KTtcblxuICAgICAgLy8gSW5zZXJ0IHRoZSBuZXcgZGl2IHJpZ2h0IGJlZm9yZSB0aGUgZmlyc3QgaXRlbVxuICAgICAgZWFybGllc3RJdGVtLmluc2VydEFkamFjZW50RWxlbWVudCgnYmVmb3JlYmVnaW4nLCBuZXdEaXYpO1xuXG4gICAgICBzZW5kTmV3TmF2VHJlZSA9IHRydWU7XG4gICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoY2hhbmdlSXRlbS50eXBlID09PSBDaGFuZ2VUeXBlLkRVUExJQ0FURSkge1xuICAgIGNvbnN0IGNoYW5nZUZpbGVkcyA9IGNoYW5nZUl0ZW0uY2hhbmdlRmllbGRzIGFzIER1cGxpY2F0ZUNoYW5nZUZpZWxkcztcbiAgICBjb25zdCBjb2RlYmFzZUlkc1RvRHVwbGljYXRlID0gY2hhbmdlRmlsZWRzLmNvZGViYXNlSWRzVG9EdXBsaWNhdGU7XG5cbiAgICBjb2RlYmFzZUlkc1RvRHVwbGljYXRlLmZvckVhY2goKGNvZGViYXNlSWRUb0R1cGxpY2F0ZSkgPT4ge1xuICAgICAgJChgLiR7Y29kZWJhc2VJZFRvRHVwbGljYXRlfWApLmVhY2goKGluZGV4OiBhbnksIGl0ZW0pID0+IHtcbiAgICAgICAgY29uc3QgY2xvbmVkTm9kZSA9IGl0ZW0uY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgICAgIGNsb25lZE5vZGUuc2V0QXR0cmlidXRlKFRFTVBPX0RFTEVURV9BRlRFUl9SRUZSRVNILCAndHJ1ZScpO1xuICAgICAgICBjbG9uZWROb2RlLnNldEF0dHJpYnV0ZShURU1QT19JTlNUQU5UX1VQREFURSwgJ3RydWUnKTsgLy8gU28gdGhhdCB0aGUgRE9NIHRyZWUgcmVmcmVzaCBkb2Vzbid0IGdldCB0cmlnZ2VyZWRcblxuICAgICAgICAvLyBTZXQgdXAgYWxsIHRoZSBjb3JyZWN0IGR1cGxpY2F0ZWQgY29kZWJhc2UgSURzXG4gICAgICAgIGNsb25lZE5vZGUuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICd0ZW1wb2VsZW1lbnRpZCcsXG4gICAgICAgICAgYCR7RFVQTElDQVRFX1BMQUNFSE9MREVSX1BSRUZJWH0ke2NvZGViYXNlSWRUb0R1cGxpY2F0ZX1gLFxuICAgICAgICApO1xuICAgICAgICBjbG9uZWROb2RlLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAnZGF0YS10ZXN0aWQnLFxuICAgICAgICAgIGAke0RVUExJQ0FURV9QTEFDRUhPTERFUl9QUkVGSVh9JHtjb2RlYmFzZUlkVG9EdXBsaWNhdGV9YCxcbiAgICAgICAgKTtcbiAgICAgICAgY2xvbmVkTm9kZS5jbGFzc0xpc3QuYWRkKFxuICAgICAgICAgIERVUExJQ0FURV9QTEFDRUhPTERFUl9QUkVGSVggKyBjb2RlYmFzZUlkVG9EdXBsaWNhdGUsXG4gICAgICAgICk7XG4gICAgICAgIGNsb25lZE5vZGUuY2xhc3NMaXN0LnJlbW92ZShjb2RlYmFzZUlkVG9EdXBsaWNhdGUpO1xuXG4gICAgICAgIGxldCBjaGlsZHJlbiA9IEFycmF5LmZyb20oY2xvbmVkTm9kZS5jaGlsZHJlbik7XG4gICAgICAgIHdoaWxlIChjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuLnBvcCgpO1xuICAgICAgICAgIGlmICghY2hpbGQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGNvZGViYXNlSWQgPVxuICAgICAgICAgICAgY2hpbGQuZ2V0QXR0cmlidXRlKCd0ZW1wb2VsZW1lbnRpZCcpIHx8XG4gICAgICAgICAgICBjaGlsZC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGVzdGlkJyk7XG4gICAgICAgICAgaWYgKCFjb2RlYmFzZUlkKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjaGlsZC5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAndGVtcG9lbGVtZW50aWQnLFxuICAgICAgICAgICAgYCR7RFVQTElDQVRFX1BMQUNFSE9MREVSX1BSRUZJWH0ke2NvZGViYXNlSWR9YCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGNoaWxkLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdkYXRhLXRlc3RpZCcsXG4gICAgICAgICAgICBgJHtEVVBMSUNBVEVfUExBQ0VIT0xERVJfUFJFRklYfSR7Y29kZWJhc2VJZH1gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY2hpbGQuY2xhc3NMaXN0LnJlbW92ZShjb2RlYmFzZUlkKTtcbiAgICAgICAgICBjaGlsZC5jbGFzc0xpc3QuYWRkKERVUExJQ0FURV9QTEFDRUhPTERFUl9QUkVGSVggKyBjb2RlYmFzZUlkKTtcbiAgICAgICAgICBjaGlsZC5zZXRBdHRyaWJ1dGUoVEVNUE9fSU5TVEFOVF9VUERBVEUsICd0cnVlJyk7XG5cbiAgICAgICAgICBjaGlsZHJlbi5wdXNoKC4uLkFycmF5LmZyb20oY2hpbGQuY2hpbGRyZW4pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCB0aGUgY2xvbmVzIG5vZGUgcmlnaHQgYWZ0ZXIgdGhlIGZvdW5kIG5vZGVcbiAgICAgICAgaXRlbS5pbnNlcnRBZGphY2VudEVsZW1lbnQoJ2FmdGVyZW5kJywgY2xvbmVkTm9kZSk7XG5cbiAgICAgICAgc2VuZE5ld05hdlRyZWUgPSB0cnVlO1xuICAgICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmIChjaGFuZ2VJdGVtLnR5cGUgPT09IENoYW5nZVR5cGUuQ0hBTkdFX1RBRykge1xuICAgIGNvbnN0IGNoYW5nZUZpZWxkcyA9IGNoYW5nZUl0ZW0uY2hhbmdlRmllbGRzIGFzIENoYW5nZVRhZ0NoYW5nZUZpZWxkcztcblxuICAgICQoYC4ke2NoYW5nZUZpZWxkcy5jb2RlYmFzZUlkVG9DaGFuZ2V9YCkuZWFjaCgoaW5kZXg6IGFueSwgaXRlbSkgPT4ge1xuICAgICAgY29uc3QgJG5ld0VsZW1lbnQgPSAkKFxuICAgICAgICAnPCcgKyBjaGFuZ2VGaWVsZHMubmV3VGFnTmFtZSArICc+PC8nICsgY2hhbmdlRmllbGRzLm5ld1RhZ05hbWUgKyAnPicsXG4gICAgICApO1xuICAgICAgJG5ld0VsZW1lbnQuYXR0cihURU1QT19JTlNUQU5UX1VQREFURSwgJ3RydWUnKTsgLy8gU28gdGhhdCB0aGUgRE9NIHRyZWUgcmVmcmVzaCBkb2Vzbid0IGdldCB0cmlnZ2VyZWRcbiAgICAgICRuZXdFbGVtZW50LmF0dHIoVEVNUE9fREVMRVRFX0FGVEVSX1JFRlJFU0gsICd0cnVlJyk7XG5cbiAgICAgIGNvbnN0ICRpdGVtID0gJChpdGVtKTtcblxuICAgICAgLy8gQ29weSBhbGwgYXR0cmlidXRlcyBmcm9tIHRoZSBvcmlnaW5hbCBlbGVtZW50IHRvIHRoZSBuZXcgZWxlbWVudFxuICAgICAgJC5lYWNoKCRpdGVtWzBdLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJG5ld0VsZW1lbnQuYXR0cih0aGlzLm5hbWUsIHRoaXMudmFsdWUpO1xuICAgICAgfSk7XG5cbiAgICAgICRpdGVtLmNvbnRlbnRzKCkuY2xvbmUodHJ1ZSwgdHJ1ZSkuYXBwZW5kVG8oJG5ld0VsZW1lbnQpO1xuXG4gICAgICAvLyBBZGQgcmlnaHQgYmVmb3JlIHRoZSBjbG9uZWQgaXRlbSBzbyB0aGUgdW5pcXVlIHBhdGggc3RheXMgdGhlIHNhbWVcbiAgICAgICRpdGVtLmJlZm9yZSgkbmV3RWxlbWVudCk7XG5cbiAgICAgIC8vIEhpZGUgdGhlIG9yaWdpbmFsIGl0ZW1cbiAgICAgICRpdGVtLmFkZENsYXNzKFRFTVBPX0RJU1BMQVlfTk9ORV9VTlRJTF9SRUZSRVNIX0NMQVNTKTtcbiAgICAgICRpdGVtLmF0dHIoVEVNUE9fRE9fTk9UX1NIT1dfSU5fTkFWX1VOVElMX1JFRlJFU0gsICd0cnVlJyk7XG5cbiAgICAgIHNlbmROZXdOYXZUcmVlID0gdHJ1ZTtcbiAgICAgIGluc3RhbnRVcGRhdGVTdWNjZXNzZnVsID0gdHJ1ZTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmIChjaGFuZ2VJdGVtLnR5cGUgPT09IENoYW5nZVR5cGUuVU5ETykge1xuICAgIGNvbnN0IHtcbiAgICAgIHNlbmROZXdOYXZUcmVlOiBfc2VuZE5ld05hdlRyZWUsXG4gICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bDogX2luc3RhbnRVcGRhdGVTdWNjZXNzZnVsLFxuICAgIH0gPSBhcHBseVVuZG9DaGFuZ2VJdGVtVG9Eb2N1bWVudChwYXJlbnRQb3J0LCBjaGFuZ2VJdGVtIGFzIFVuZG9DaGFuZ2UpO1xuXG4gICAgc2VuZE5ld05hdlRyZWUgPSBfc2VuZE5ld05hdlRyZWU7XG4gICAgaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWwgPSBfaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWw7XG4gIH0gZWxzZSBpZiAoY2hhbmdlSXRlbS50eXBlID09PSBDaGFuZ2VUeXBlLlJFRE8pIHtcbiAgICBjb25zdCBjaGFuZ2VGaWVsZHMgPSBjaGFuZ2VJdGVtLmNoYW5nZUZpZWxkcyBhcyBSZWRvQ2hhbmdlRmllbGRzO1xuXG4gICAgY29uc3QgY2hhbmdlVG9SZWRvID0gY2hhbmdlRmllbGRzLmNoYW5nZVRvUmVkbztcblxuICAgIGlmIChDSEFOR0VfVFlQRVNfV0lUSF9JTlNUQU5UX1VORE8uaW5jbHVkZXMoY2hhbmdlVG9SZWRvLnR5cGUpKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHNlbmROZXdOYXZUcmVlOiBfc2VuZE5ld05hdlRyZWUsXG4gICAgICAgIGluc3RhbnRVcGRhdGVTdWNjZXNzZnVsOiBfaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWwsXG4gICAgICB9ID0gYXBwbHlDaGFuZ2VJdGVtVG9Eb2N1bWVudChwYXJlbnRQb3J0LCBzdG9yeWJvYXJkSWQsIGNoYW5nZVRvUmVkbyk7XG5cbiAgICAgIHNlbmROZXdOYXZUcmVlID0gX3NlbmROZXdOYXZUcmVlO1xuICAgICAgaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWwgPSBfaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWw7XG5cbiAgICAgIGlmIChjaGFuZ2VUb1JlZG8ucHJldklkVG9OZXdJZE1hcCkge1xuICAgICAgICB1cGRhdGVDb2RlYmFzZUlkcyhwYXJlbnRQb3J0LCBjaGFuZ2VUb1JlZG8ucHJldklkVG9OZXdJZE1hcCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSW1tZWRpYXRlbHkgc2V0IHRoZSBuZXcgc2VsZWN0ZWQgZWxlbWVudCBrZXlzIHRvIHByZXZlbnQgYW55IGRlbGF5IGluIHRoZSBvdXRsaW5lcyB1cGRhdGluZ1xuICBsZXQgZWxlbWVudEtleVRvU2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlID1cbiAgICBjaGFuZ2VJdGVtLmdldEVsZW1lbnRLZXlUb1NlbGVjdEFmdGVySW5zdGFudFVwZGF0ZSgpO1xuICBsZXQgZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlID1cbiAgICBjaGFuZ2VJdGVtLmdldEVsZW1lbnRLZXlzVG9NdWx0aXNlbGVjdEFmdGVySW5zdGFudFVwZGF0ZSgpO1xuXG4gIGlmIChjaGFuZ2VJdGVtLnR5cGUgPT09IENoYW5nZVR5cGUuVU5ETykge1xuICAgIGVsZW1lbnRLZXlUb1NlbGVjdEFmdGVySW5zdGFudFVwZGF0ZSA9IChcbiAgICAgIGNoYW5nZUl0ZW0uY2hhbmdlRmllbGRzIGFzIFVuZG9DaGFuZ2VGaWVsZHNcbiAgICApLmNoYW5nZVRvVW5kby5nZXRFbGVtZW50S2V5VG9TZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlKCk7XG4gICAgZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlID0gKFxuICAgICAgY2hhbmdlSXRlbS5jaGFuZ2VGaWVsZHMgYXMgVW5kb0NoYW5nZUZpZWxkc1xuICAgICkuY2hhbmdlVG9VbmRvLmdldEVsZW1lbnRLZXlzVG9NdWx0aXNlbGVjdEFmdGVyVW5kb0luc3RhbnRVcGRhdGUoKTtcbiAgfVxuXG4gIGlmIChlbGVtZW50S2V5VG9TZWxlY3RBZnRlckluc3RhbnRVcGRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgIHNldE1lbW9yeVN0b3JhZ2VJdGVtKFxuICAgICAgU0VMRUNURURfRUxFTUVOVF9LRVksXG4gICAgICBlbGVtZW50S2V5VG9TZWxlY3RBZnRlckluc3RhbnRVcGRhdGUsXG4gICAgKTtcbiAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuU0VMRUNURURfRUxFTUVOVF9LRVksXG4gICAgICBlbGVtZW50S2V5OiBlbGVtZW50S2V5VG9TZWxlY3RBZnRlckluc3RhbnRVcGRhdGUsXG4gICAgICBvdXRlckhUTUw6ICQoXG4gICAgICAgIGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtlbGVtZW50S2V5VG9TZWxlY3RBZnRlckluc3RhbnRVcGRhdGV9YCxcbiAgICAgICkuZ2V0KDApPy5vdXRlckhUTUwsXG4gICAgfSk7XG4gIH1cblxuICBpZiAoZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShcbiAgICAgIE1VTFRJX1NFTEVDVEVEX0VMRU1FTlRfS0VZUyxcbiAgICAgIGVsZW1lbnRLZXlzVG9NdWx0aXNlbGVjdEFmdGVySW5zdGFudFVwZGF0ZSxcbiAgICApO1xuICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5NVUxUSV9TRUxFQ1RFRF9FTEVNRU5UX0tFWVMsXG4gICAgICBlbGVtZW50S2V5czogZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlLFxuICAgICAgb3V0ZXJIVE1MczogZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlPy5tYXAoXG4gICAgICAgIChlbGVtZW50S2V5KSA9PlxuICAgICAgICAgICQoYC4ke0VMRU1FTlRfS0VZX1BSRUZJWH0ke2VsZW1lbnRLZXl9YCkuZ2V0KDApPy5vdXRlckhUTUwsXG4gICAgICApLFxuICAgIH0pO1xuICB9XG5cbiAgaWYgKGluc3RhbnRVcGRhdGVTdWNjZXNzZnVsKSB7XG4gICAgLy8gRGVsZXRlIGFueSBlbGVtZW50cyB0aGF0IG5lZWQgdG8gYmUgZGVsZXRlZCBhZnRlciBpbnN0YW50IHVwZGF0ZXNcbiAgICAkKGAqWyR7VEVNUE9fREVMRVRFX0FGVEVSX0lOU1RBTlRfVVBEQVRFfT10cnVlXWApLnJlbW92ZSgpO1xuICB9XG5cbiAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5JTlNUQU5UX1VQREFURV9ET05FLFxuICAgIGNoYW5nZUl0ZW06IHBsYWluQ2hhbmdlSXRlbSxcbiAgICBpbnN0YW50VXBkYXRlRGF0YTogZXh0cmFJbnN0YW50VXBkYXRlRGF0YSxcbiAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCxcbiAgfSk7XG5cbiAgcmV0dXJuIHsgc2VuZE5ld05hdlRyZWUsIGluc3RhbnRVcGRhdGVTdWNjZXNzZnVsIH07XG59O1xuXG5jb25zdCBhcHBseVVuZG9DaGFuZ2VJdGVtVG9Eb2N1bWVudCA9IChcbiAgcGFyZW50UG9ydDogYW55LFxuICBjaGFuZ2VJdGVtOiBVbmRvQ2hhbmdlLFxuKTogeyBzZW5kTmV3TmF2VHJlZTogYm9vbGVhbjsgaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWw6IGJvb2xlYW4gfSA9PiB7XG4gIGNvbnN0IGNoYW5nZUZpZWxkcyA9IGNoYW5nZUl0ZW0uY2hhbmdlRmllbGRzO1xuXG4gIGNvbnN0IGNoYW5nZVRvVW5kbyA9IGNoYW5nZUZpZWxkcy5jaGFuZ2VUb1VuZG87XG5cbiAgaWYgKCFDSEFOR0VfVFlQRVNfV0lUSF9JTlNUQU5UX1VORE8uaW5jbHVkZXMoY2hhbmdlVG9VbmRvLnR5cGUpKSB7XG4gICAgcmV0dXJuIHsgc2VuZE5ld05hdlRyZWU6IGZhbHNlLCBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bDogZmFsc2UgfTtcbiAgfVxuXG4gIGxldCBzZW5kTmV3TmF2VHJlZSA9IGZhbHNlO1xuICBsZXQgaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWwgPSBmYWxzZTtcblxuICAvLyBBUEkgaGFzIGNvbXBsZXRlZCBhbmQgdGhlIElEcyBoYXZlIGJlZW4gdXBkYXRlZCwgcmV2ZXJzZSB0aGlzIGNoYW5nZVxuICBpZiAoY2hhbmdlVG9VbmRvLnByZXZJZFRvTmV3SWRNYXApIHtcbiAgICBjb25zdCB1bmRvQ29kZWJhc2VJZENoYW5nZXM6IHtcbiAgICAgIFtuZXdDb2RlYmFzZUlkOiBzdHJpbmddOiBzdHJpbmc7XG4gICAgfSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKGNoYW5nZVRvVW5kby5wcmV2SWRUb05ld0lkTWFwKS5mb3JFYWNoKChwcmV2SWQpID0+IHtcbiAgICAgIGNvbnN0IG5ld0lkID0gY2hhbmdlVG9VbmRvLnByZXZJZFRvTmV3SWRNYXBbcHJldklkXTtcbiAgICAgIHVuZG9Db2RlYmFzZUlkQ2hhbmdlc1tuZXdJZF0gPSBwcmV2SWQ7XG4gICAgfSk7XG5cbiAgICAvLyBJZiB1bmRvaW5nIGRvIG5vdCB1cGRhdGUgdGhlIGNvZGViYXNlIElEcyBiYWNrd2FyZHMgaWYgdGhlcmUgYXJlIGNvZGViYXNlIElEcyB0byBzZXQgYWZ0ZXJcbiAgICAvLyB0aGUgdW5kbyBpbnN0YW50IHVwZGF0ZSBpcyBkb25lXG4gICAgY29uc3Qgc2VsZWN0ZWRFbGVtZW50U3BlY2lmaWVkQWZ0ZXJVbmRvID1cbiAgICAgIGNoYW5nZVRvVW5kby5nZXRFbGVtZW50S2V5VG9TZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlKCkgIT09IHVuZGVmaW5lZDtcbiAgICB1cGRhdGVDb2RlYmFzZUlkcyhcbiAgICAgIHBhcmVudFBvcnQsXG4gICAgICB1bmRvQ29kZWJhc2VJZENoYW5nZXMsXG4gICAgICAhc2VsZWN0ZWRFbGVtZW50U3BlY2lmaWVkQWZ0ZXJVbmRvLFxuICAgICk7XG4gIH1cblxuICAvLyBUaGVuIHVuZG8gdGhlIGFjdHVhbCBjaGFuZ2VcbiAgaWYgKGNoYW5nZVRvVW5kby50eXBlID09PSBDaGFuZ2VUeXBlLlJFTU9WRV9KU1gpIHtcbiAgICAvLyBSZS1hZGQgdGhlIHJlbW92ZWQgSlNYXG4gICAgY29uc3QgaW5uZXJDaGFuZ2VGaWVsZHMgPVxuICAgICAgY2hhbmdlVG9VbmRvLmNoYW5nZUZpZWxkcyBhcyBSZW1vdmVKc3hDaGFuZ2VGaWVsZHM7XG4gICAgY29uc3QgY29kZWJhc2VJZHNUb1JlYWRkID0gaW5uZXJDaGFuZ2VGaWVsZHMuY29kZWJhc2VJZHNUb1JlbW92ZTtcblxuICAgIC8vIElmIGl0IGhhcyBiZWVuIGZsdXNoZWQsIHJlLWNyZWF0ZSB0aGUgaHRtbCBlbGVtZW50cyBmcm9tIHRoZSBzYXZlZCBpbm5lciBIVE1MXG4gICAgaWYgKGNoYW5nZUZpZWxkcy5tYXRjaGluZ0FjdGl2aXR5Rmx1c2hlZCkge1xuICAgICAgY29uc3QgaW5zdGFudFVwZGF0ZURhdGEgPSBjaGFuZ2VUb1VuZG8uZ2V0SW5zdGFudFVwZGF0ZURhdGEoKTtcbiAgICAgIGNvbnN0IHBhcmVudFRvRWxlbWVudEtleXNSZW1vdmVkOiB7XG4gICAgICAgIFtwYXJlbnRFbGVtZW50S2V5OiBzdHJpbmddOiBhbnlbXTtcbiAgICAgIH0gPSBpbnN0YW50VXBkYXRlRGF0YS5wYXJlbnRUb0VsZW1lbnRLZXlzUmVtb3ZlZCB8fCB7fTtcblxuICAgICAgT2JqZWN0LmVudHJpZXMocGFyZW50VG9FbGVtZW50S2V5c1JlbW92ZWQpLmZvckVhY2goXG4gICAgICAgIChbcGFyZW50RWxlbWVudEtleSwgaXRlbXNSZW1vdmVkXSkgPT4ge1xuICAgICAgICAgIC8vIFNvcnQgdGhlIHJlbW92ZWQgZW50cmllcyBpbiBvcmRlciBvZiB1bmlxdWUgcGF0aFxuICAgICAgICAgIGNvbnN0IHNvcnRlZEl0ZW1zUmVtb3ZlZCA9IE9iamVjdC52YWx1ZXMoaXRlbXNSZW1vdmVkKS5zb3J0KFxuICAgICAgICAgICAgKGE6IGFueSwgYjogYW55KSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGFFbGVtZW50S2V5ID0gVGVtcG9FbGVtZW50LmZyb21LZXkoYS5lbGVtZW50S2V5UmVtb3ZlZCk7XG4gICAgICAgICAgICAgIGNvbnN0IGJFbGVtZW50S2V5ID0gVGVtcG9FbGVtZW50LmZyb21LZXkoYi5lbGVtZW50S2V5UmVtb3ZlZCk7XG4gICAgICAgICAgICAgIHJldHVybiBhRWxlbWVudEtleS51bmlxdWVQYXRoLmxvY2FsZUNvbXBhcmUoXG4gICAgICAgICAgICAgICAgYkVsZW1lbnRLZXkudW5pcXVlUGF0aCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIC8vIEZpbmQgdGhlIHBhcmVudCBlbGVtZW50XG4gICAgICAgICAgY29uc3QgcGFyZW50RWxlbWVudCA9ICQoXG4gICAgICAgICAgICBgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7cGFyZW50RWxlbWVudEtleX1gLFxuICAgICAgICAgICkuZ2V0KDApO1xuICAgICAgICAgIGlmIChwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAvLyBBZGQgdGhlIHJlbW92ZWQgZWxlbWVudHMgYmFjayBpbiBvcmRlclxuICAgICAgICAgICAgc29ydGVkSXRlbXNSZW1vdmVkLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB7IGVsZW1lbnRLZXlSZW1vdmVkLCBvdXRlckhUTUwgfSA9IGl0ZW07XG5cbiAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IFRlbXBvRWxlbWVudC5mcm9tS2V5KGVsZW1lbnRLZXlSZW1vdmVkKTtcbiAgICAgICAgICAgICAgY29uc3QgaW5kZXhJblBhcmVudCA9IE51bWJlcihlbGVtZW50LnVuaXF1ZVBhdGguc3BsaXQoJy0nKS5wb3AoKSk7XG5cbiAgICAgICAgICAgICAgY29uc3QgbmV3RWxlbWVudEZyb21IdG1sID0gJChvdXRlckhUTUwpLmdldCgwKTtcblxuICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIHBhcmVudCBpbiB0aGUgaW5kZXhcbiAgICAgICAgICAgICAgaWYgKG5ld0VsZW1lbnRGcm9tSHRtbCkge1xuICAgICAgICAgICAgICAgIG5ld0VsZW1lbnRGcm9tSHRtbC5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgICBURU1QT19ERUxFVEVfQUZURVJfUkVGUkVTSCxcbiAgICAgICAgICAgICAgICAgICd0cnVlJyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIG5ld0VsZW1lbnRGcm9tSHRtbC5zZXRBdHRyaWJ1dGUoVEVNUE9fSU5TVEFOVF9VUERBVEUsICd0cnVlJyk7XG4gICAgICAgICAgICAgICAgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoXG4gICAgICAgICAgICAgICAgICBuZXdFbGVtZW50RnJvbUh0bWwsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50LmNoaWxkcmVuW2luZGV4SW5QYXJlbnRdIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2VuZE5ld05hdlRyZWUgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb3QgZmx1c2hlZCB5ZXQgc28gY2FuIGp1c3QgcmUtYWRkXG4gICAgICBjb2RlYmFzZUlkc1RvUmVhZGQuZm9yRWFjaCgoY29kZWJhc2VJZFRvUmVhZGQpID0+IHtcbiAgICAgICAgJChgLiR7Y29kZWJhc2VJZFRvUmVhZGR9YCkuZWFjaCgoaW5kZXgsIGl0ZW0pID0+IHtcbiAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoVEVNUE9fRElTUExBWV9OT05FX1VOVElMX1JFRlJFU0hfQ0xBU1MpO1xuICAgICAgICAgIGl0ZW0ucmVtb3ZlQXR0cmlidXRlKFRFTVBPX0RPX05PVF9TSE9XX0lOX05BVl9VTlRJTF9SRUZSRVNIKTtcblxuICAgICAgICAgIHNlbmROZXdOYXZUcmVlID0gdHJ1ZTtcbiAgICAgICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKFxuICAgIGNoYW5nZVRvVW5kby50eXBlID09PSBDaGFuZ2VUeXBlLkFERF9DTEFTUyB8fFxuICAgIGNoYW5nZVRvVW5kby50eXBlID09PSBDaGFuZ2VUeXBlLlNUWUxJTkdcbiAgKSB7XG4gICAgY29uc3QgaW5zdGFudFVwZGF0ZURhdGEgPSBjaGFuZ2VUb1VuZG8uZ2V0SW5zdGFudFVwZGF0ZURhdGEoKTtcbiAgICBjb25zdCBpbm5lckNoYW5nZUZpZWxkcyA9IGNoYW5nZVRvVW5kby5jaGFuZ2VGaWVsZHMgYXMgQWRkQ2xhc3NDaGFuZ2VGaWVsZHM7XG5cbiAgICBjb25zdCBhZGRlZENsYXNzID0gaW5zdGFudFVwZGF0ZURhdGE/LmFkZGVkQ2xhc3M7XG4gICAgaWYgKGFkZGVkQ2xhc3MpIHtcbiAgICAgICQoYC4ke2lubmVyQ2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb0FkZENsYXNzfWApLmVhY2goKGluZGV4LCBpdGVtKSA9PiB7XG4gICAgICAgIGlmICgkKGl0ZW0pLmhhc0NsYXNzKGFkZGVkQ2xhc3MpKSB7XG4gICAgICAgICAgJChpdGVtKS5yZW1vdmVDbGFzcyhhZGRlZENsYXNzKTtcbiAgICAgICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGNvZGViYXNlQWRkZWRDbGFzcyA9IGluc3RhbnRVcGRhdGVEYXRhPy5jb2RlYmFzZUFkZGVkQ2xhc3M7XG4gICAgaWYgKGNvZGViYXNlQWRkZWRDbGFzcykge1xuICAgICAgJChgLiR7aW5uZXJDaGFuZ2VGaWVsZHMuY29kZWJhc2VJZFRvQWRkQ2xhc3N9YCkuZWFjaCgoaW5kZXgsIGl0ZW0pID0+IHtcbiAgICAgICAgaWYgKCQoaXRlbSkuaGFzQ2xhc3MoY29kZWJhc2VBZGRlZENsYXNzKSkge1xuICAgICAgICAgICQoaXRlbSkucmVtb3ZlQ2xhc3MoY29kZWJhc2VBZGRlZENsYXNzKTtcbiAgICAgICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIGlmIChjaGFuZ2VUb1VuZG8udHlwZSA9PT0gQ2hhbmdlVHlwZS5BRERfSlNYKSB7XG4gICAgY29uc3QgaW5zdGFudFVwZGF0ZURhdGEgPSBjaGFuZ2VUb1VuZG8uZ2V0SW5zdGFudFVwZGF0ZURhdGEoKTtcbiAgICBjb25zdCBhZGRlZElkcyA9IGluc3RhbnRVcGRhdGVEYXRhPy5hZGRlZElkcztcblxuICAgIGFkZGVkSWRzPy5mb3JFYWNoKChhZGRlZElkOiBzdHJpbmcpID0+IHtcbiAgICAgICQoYC4ke2FkZGVkSWR9YCkucmVtb3ZlKCk7XG4gICAgICBpbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgfSk7XG5cbiAgICBzZW5kTmV3TmF2VHJlZSA9IHRydWU7XG4gIH1cblxuICByZXR1cm4geyBzZW5kTmV3TmF2VHJlZSwgaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWwgfTtcbn07XG5cbi8qKlxuICogQWZ0ZXIgYSBjaGFuZ2UgaXMgcHJvY2Vzc2VkIG9uIHRoZSBiYWNrZW5kLCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgY29kZWJhc2UgaWRzIGluIHRoZSBkb2N1bWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHVwZGF0ZUNvZGViYXNlSWRzID0gKFxuICBwYXJlbnRQb3J0OiBhbnksXG4gIHByZXZJZFRvTmV3SWRNYXA6IHtcbiAgICBbcHJldkNvZGViYXNlSWQ6IHN0cmluZ106IHN0cmluZztcbiAgfSxcbiAgdXBkYXRlRWxlbWVudEtleXM/OiBib29sZWFuLFxuKTogYm9vbGVhbiA9PiB7XG4gIC8vIFVwZGF0ZSBjb2RlYmFzZSBpZHMgaW4gdGhlIGRvY3VtZW50XG4gIGNvbnN0IGNoYW5nZXM6IGFueSA9IFtdO1xuICBPYmplY3QuZW50cmllcyhwcmV2SWRUb05ld0lkTWFwKS5mb3JFYWNoKFxuICAgIChbcHJldkNvZGViYXNlSWQsIG5ld0NvZGViYXNlSWRdKSA9PiB7XG4gICAgICAkKGAuJHtwcmV2Q29kZWJhc2VJZH1gKS5lYWNoKChpbmRleDogYW55LCBpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgY2hhbmdlcy5wdXNoKHtcbiAgICAgICAgICBpdGVtLFxuICAgICAgICAgIHByZXZDb2RlYmFzZUlkLFxuICAgICAgICAgIG5ld0NvZGViYXNlSWQsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcbiAgKTtcblxuICAvLyBDb2RlYmFzZSBJZHMgY2FuIHN3YXAsIHNvIHdlIGhhdmUgdG8gYXBwbHkgdGhlIGNoYW5nZXMgYWZ0ZXIgbG9va2luZyBhbGwgZWxlbWVudHMgdXBcbiAgY2hhbmdlcy5mb3JFYWNoKChjaGFuZ2U6IGFueSkgPT4ge1xuICAgIGNvbnN0ICRpdGVtID0gJChjaGFuZ2UuaXRlbSk7XG4gICAgY29uc3QgbmV3Q2xhc3MgPSAoJGl0ZW0uYXR0cignY2xhc3MnKSB8fCAnJykucmVwbGFjZShcbiAgICAgIG5ldyBSZWdFeHAoYCR7Y2hhbmdlLnByZXZDb2RlYmFzZUlkfWAsICdnJyksXG4gICAgICBjaGFuZ2UubmV3Q29kZWJhc2VJZCxcbiAgICApO1xuICAgICRpdGVtLmF0dHIoJ2NsYXNzJywgbmV3Q2xhc3MpO1xuXG4gICAgY2hhbmdlLml0ZW0uc2V0QXR0cmlidXRlKCd0ZW1wb2VsZW1lbnRpZCcsIGNoYW5nZS5uZXdDb2RlYmFzZUlkKTtcbiAgICBjaGFuZ2UuaXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGVzdGlkJywgY2hhbmdlLm5ld0NvZGViYXNlSWQpO1xuICB9KTtcblxuICBpZiAoIXVwZGF0ZUVsZW1lbnRLZXlzKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oY2hhbmdlcy5sZW5ndGgpO1xuICB9XG5cbiAgY29uc3Qga2V5c1RvQ2hlY2sgPSBbXG4gICAge1xuICAgICAga2V5OiBTRUxFQ1RFRF9FTEVNRU5UX0tFWSxcbiAgICAgIG1lc3NhZ2VJZDogRklYRURfSUZSQU1FX01FU1NBR0VfSURTLlNFTEVDVEVEX0VMRU1FTlRfS0VZLFxuICAgIH0sXG4gICAge1xuICAgICAga2V5OiBIT1ZFUkVEX0VMRU1FTlRfS0VZLFxuICAgICAgbWVzc2FnZUlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuSE9WRVJFRF9FTEVNRU5UX0tFWSxcbiAgICB9LFxuICBdO1xuICBrZXlzVG9DaGVjay5mb3JFYWNoKCh7IGtleSwgbWVzc2FnZUlkIH0pID0+IHtcbiAgICBjb25zdCBlbGVtZW50S2V5ID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oa2V5KTtcbiAgICBjb25zdCB0ZW1wb0VsZW1lbnQgPSBUZW1wb0VsZW1lbnQuZnJvbUtleShlbGVtZW50S2V5KTtcbiAgICBpZiAocHJldklkVG9OZXdJZE1hcFt0ZW1wb0VsZW1lbnQuY29kZWJhc2VJZF0pIHtcbiAgICAgIGNvbnN0IG5ld0VsZW1lbnQgPSBuZXcgVGVtcG9FbGVtZW50KFxuICAgICAgICBwcmV2SWRUb05ld0lkTWFwW3RlbXBvRWxlbWVudC5jb2RlYmFzZUlkXSxcbiAgICAgICAgdGVtcG9FbGVtZW50LnN0b3J5Ym9hcmRJZCxcbiAgICAgICAgdGVtcG9FbGVtZW50LnVuaXF1ZVBhdGgsXG4gICAgICApO1xuICAgICAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oa2V5LCBuZXdFbGVtZW50LmdldEtleSgpKTtcblxuICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgIGlkOiBtZXNzYWdlSWQsXG4gICAgICAgIGVsZW1lbnRLZXk6IG5ld0VsZW1lbnQuZ2V0S2V5KCksXG4gICAgICAgIG91dGVySFRNTDogJChgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7bmV3RWxlbWVudC5nZXRLZXkoKX1gKS5nZXQoMClcbiAgICAgICAgICA/Lm91dGVySFRNTCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQWxzbyB1cGRhdGUgdGhlIG11bHRpc2VsZWN0ZWQgZWxlbWVudCBrZXlzXG4gIGNvbnN0IG11bHRpc2VsZWN0ZWRFbGVtZW50S2V5cyA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKFxuICAgIE1VTFRJX1NFTEVDVEVEX0VMRU1FTlRfS0VZUyxcbiAgKTtcbiAgaWYgKG11bHRpc2VsZWN0ZWRFbGVtZW50S2V5cz8ubGVuZ3RoKSB7XG4gICAgY29uc3QgbmV3TXVsdGlzZWxlY3RlZEVsZW1lbnRLZXlzOiBzdHJpbmdbXSA9IFtdO1xuICAgIG11bHRpc2VsZWN0ZWRFbGVtZW50S2V5cy5mb3JFYWNoKChlbGVtZW50S2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IHRlbXBvRWxlbWVudCA9IFRlbXBvRWxlbWVudC5mcm9tS2V5KGVsZW1lbnRLZXkpO1xuICAgICAgaWYgKHByZXZJZFRvTmV3SWRNYXBbdGVtcG9FbGVtZW50LmNvZGViYXNlSWRdKSB7XG4gICAgICAgIGNvbnN0IG5ld0VsZW1lbnQgPSBuZXcgVGVtcG9FbGVtZW50KFxuICAgICAgICAgIHByZXZJZFRvTmV3SWRNYXBbdGVtcG9FbGVtZW50LmNvZGViYXNlSWRdLFxuICAgICAgICAgIHRlbXBvRWxlbWVudC5zdG9yeWJvYXJkSWQsXG4gICAgICAgICAgdGVtcG9FbGVtZW50LnVuaXF1ZVBhdGgsXG4gICAgICAgICk7XG4gICAgICAgIG5ld011bHRpc2VsZWN0ZWRFbGVtZW50S2V5cy5wdXNoKG5ld0VsZW1lbnQuZ2V0S2V5KCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3TXVsdGlzZWxlY3RlZEVsZW1lbnRLZXlzLnB1c2goZWxlbWVudEtleSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzZXRNZW1vcnlTdG9yYWdlSXRlbShcbiAgICAgIE1VTFRJX1NFTEVDVEVEX0VMRU1FTlRfS0VZUyxcbiAgICAgIG5ld011bHRpc2VsZWN0ZWRFbGVtZW50S2V5cyxcbiAgICApO1xuICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5NVUxUSV9TRUxFQ1RFRF9FTEVNRU5UX0tFWVMsXG4gICAgICBlbGVtZW50S2V5czogbmV3TXVsdGlzZWxlY3RlZEVsZW1lbnRLZXlzLFxuICAgICAgb3V0ZXJIVE1MczogbmV3TXVsdGlzZWxlY3RlZEVsZW1lbnRLZXlzPy5tYXAoXG4gICAgICAgIChlbGVtZW50S2V5KSA9PlxuICAgICAgICAgICQoYC4ke0VMRU1FTlRfS0VZX1BSRUZJWH0ke2VsZW1lbnRLZXl9YCkuZ2V0KDApPy5vdXRlckhUTUwsXG4gICAgICApLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIEJvb2xlYW4oY2hhbmdlcy5sZW5ndGgpO1xufTtcbiJdfQ==