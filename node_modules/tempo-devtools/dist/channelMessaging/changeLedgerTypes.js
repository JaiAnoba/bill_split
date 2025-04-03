"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconstructChangeLedgerClass = exports.UnknownChange = exports.RedoChange = exports.UndoChange = exports.EditTextChange = exports.RemoveClassChange = exports.AddClassChange = exports.ChangeTagChange = exports.DuplicateChange = exports.WrapDivChange = exports.ChangePropChange = exports.RemoveJsxChange = exports.MoveJsxChange = exports.AddJsxChange = exports.StylingChange = exports.ChangeLedgerItem = exports.CHANGE_TYPES_WITH_INSTANT_UNDO = exports.ChangeType = exports.StylingFramework = void 0;
const tempoElement_1 = require("./tempoElement");
const uuid_1 = require("uuid");
// Matches the file in tempo-devtools
var StylingFramework;
(function (StylingFramework) {
    StylingFramework["INLINE"] = "Inline";
    StylingFramework["CSS"] = "CSS";
    StylingFramework["TAILWIND"] = "Tailwind";
})(StylingFramework || (exports.StylingFramework = StylingFramework = {}));
var ChangeType;
(function (ChangeType) {
    ChangeType["STYLING"] = "STYLING";
    ChangeType["ADD_JSX"] = "ADD_JSX";
    ChangeType["MOVE_JSX"] = "MOVE_JSX";
    ChangeType["REMOVE_JSX"] = "REMOVE_JSX";
    ChangeType["CHANGE_PROP"] = "CHANGE_PROP";
    ChangeType["ADD_CLASS"] = "ADD_CLASS";
    ChangeType["REMOVE_CLASS"] = "REMOVE_CLASS";
    ChangeType["EDIT_TEXT"] = "EDIT_TEXT";
    ChangeType["WRAP_DIV"] = "WRAP_DIV";
    ChangeType["CHANGE_TAG"] = "CHANGE_TAG";
    ChangeType["DUPLICATE"] = "DUPLICATE";
    ChangeType["UNDO"] = "UNDO";
    ChangeType["REDO"] = "REDO";
    ChangeType["UNKNOWN"] = "UNKNOWN";
})(ChangeType || (exports.ChangeType = ChangeType = {}));
// Make sure to match this in both tempo-devtools & ** tempo-api ** (in the undo/redo file)
exports.CHANGE_TYPES_WITH_INSTANT_UNDO = [
    ChangeType.REMOVE_JSX,
    ChangeType.ADD_CLASS,
    ChangeType.STYLING,
];
class ChangeLedgerItem {
    constructor(type, changeName, changeFields, id) {
        this.prevIdToNewIdMap = {};
        this.id = id || (0, uuid_1.v4)();
        this.type = type;
        this.changeFields = changeFields;
        this.changeName = changeName;
        this._consumed = false;
        this._failed = false;
        this._instantUpdateSent = false;
        this._instantUpdateFinished = false;
        this._instantUpdateSuccessful = false;
        this._sendInstantUpdate = true;
        this.canInstantUpdateWhileFlushing = false;
        this._apiPromise = new Promise((resolve, reject) => {
            this._resolveApi = resolve;
            this._rejectApi = reject;
        });
    }
    resolveApi(data) {
        var _a;
        (_a = this._resolveApi) === null || _a === void 0 ? void 0 : _a.call(this, data);
    }
    rejectApi(reason) {
        var _a;
        if (this._apiRejectionAdded) {
            (_a = this._rejectApi) === null || _a === void 0 ? void 0 : _a.call(this, reason);
        }
    }
    needsToSendInstantUpdate() {
        return !this._instantUpdateSent && this._sendInstantUpdate;
    }
    markInstantUpdateSent() {
        this._instantUpdateSent = true;
    }
    markInstantUpdateFinished(instantUpdateData, instantUpdateSuccessful) {
        this._instantUpdateFinished = true;
        this._instantUpdateSuccessful = instantUpdateSuccessful;
        this._instantUpdateData = instantUpdateData;
    }
    getInstantUpdateData() {
        return this._instantUpdateData;
    }
    wasInstantUpdateSuccessful() {
        return this._instantUpdateSuccessful;
    }
    isInstantUpdateFinished() {
        return this._instantUpdateFinished;
    }
    markProcessedSucceeded() {
        this._consumed = true;
    }
    markProcessedFailed() {
        this._failed = true;
        this._consumed = true;
    }
    isFailed() {
        return this._failed;
    }
    needToProcessChange() {
        return !this._consumed;
    }
    onApiResolve(onFulfilled) {
        return this._apiPromise.then(onFulfilled);
    }
    onApiReject(onRejected) {
        this._apiRejectionAdded = true;
        return this._apiPromise.catch(onRejected);
    }
    doNotSendInstantUpdate() {
        this._sendInstantUpdate = false;
    }
    // For selecting/deslecting new elements after instant updates
    clearSelectedElementsAfterInstantUpdate() {
        this.elementKeyToSelectAfterInstantUpdate = null;
        this.elementKeysToMultiselectAfterInstantUpdate = null;
    }
    setSelectedElementsAfterInstantUpdate(selectedElementKey, multiselectedElementKeys) {
        this.elementKeyToSelectAfterInstantUpdate = selectedElementKey;
        this.elementKeysToMultiselectAfterInstantUpdate = multiselectedElementKeys;
    }
    clearSelectedElementsAfterUndoInstantUpdate() {
        this.elementKeyToSelectAfterUndoInstantUpdate = null;
        this.elementKeysToMultiselectAfterUndoInstantUpdate = null;
    }
    setSelectedElementsAfterUndoInstantUpdate(selectedElementKey, multiselectedElementKeys) {
        this.elementKeyToSelectAfterUndoInstantUpdate = selectedElementKey;
        this.elementKeysToMultiselectAfterUndoInstantUpdate =
            multiselectedElementKeys;
    }
    getElementKeyToSelectAfterInstantUpdate() {
        return this.elementKeyToSelectAfterInstantUpdate;
    }
    getElementKeysToMultiselectAfterInstantUpdate() {
        return this.elementKeysToMultiselectAfterInstantUpdate;
    }
    getElementKeyToSelectAfterUndoInstantUpdate() {
        return this.elementKeyToSelectAfterUndoInstantUpdate;
    }
    getElementKeysToMultiselectAfterUndoInstantUpdate() {
        return this.elementKeysToMultiselectAfterUndoInstantUpdate;
    }
    applyAllCodebaseIdChanges(prevIdToNewIdMap) {
        var _a, _b;
        const getNewKey = (prevKey) => {
            if (!prevKey) {
                return null;
            }
            const tempoElement = tempoElement_1.TempoElement.fromKey(prevKey);
            const codebaseId = tempoElement.codebaseId;
            const newCodebaseId = prevIdToNewIdMap[codebaseId];
            if (newCodebaseId) {
                return new tempoElement_1.TempoElement(newCodebaseId, tempoElement.storyboardId, tempoElement.uniquePath).getKey();
            }
            return null;
        };
        /*
         * Instant update fields
         */
        if (this.elementKeyToSelectAfterInstantUpdate) {
            const newElementKey = getNewKey(this.elementKeyToSelectAfterInstantUpdate);
            this.elementKeyToSelectAfterInstantUpdate =
                newElementKey || this.elementKeyToSelectAfterInstantUpdate;
        }
        if (this.elementKeysToMultiselectAfterInstantUpdate) {
            this.elementKeysToMultiselectAfterInstantUpdate =
                (_a = this.elementKeysToMultiselectAfterInstantUpdate) === null || _a === void 0 ? void 0 : _a.map((key) => {
                    const newKey = getNewKey(key);
                    return newKey || key;
                });
        }
        /*
         * Undo instant update fields
         */
        if (this.elementKeyToSelectAfterUndoInstantUpdate) {
            const newElementKey = getNewKey(this.elementKeyToSelectAfterUndoInstantUpdate);
            this.elementKeyToSelectAfterUndoInstantUpdate =
                newElementKey || this.elementKeyToSelectAfterUndoInstantUpdate;
        }
        if (this.elementKeysToMultiselectAfterUndoInstantUpdate) {
            this.elementKeysToMultiselectAfterUndoInstantUpdate =
                (_b = this.elementKeysToMultiselectAfterUndoInstantUpdate) === null || _b === void 0 ? void 0 : _b.map((key) => {
                    const newKey = getNewKey(key);
                    return newKey || key;
                });
        }
        this.applyCodebaseIdChanges(prevIdToNewIdMap);
    }
}
exports.ChangeLedgerItem = ChangeLedgerItem;
class StylingChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        super(ChangeType.STYLING, 'Styling', changeFields, id);
        // Allow instant updates while flushing
        this.canInstantUpdateWhileFlushing = true;
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseId, stylingChanges, stylingFramework, modifiers, customProperties, } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/styling`,
            body: {
                reactElement: treeElementLookup[codebaseId],
                styling: stylingChanges,
                stylingFramework,
                modifiers,
                customProperties,
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        const newCodebaseId = prevIdToNewIdMap[this.changeFields.codebaseId];
        if (newCodebaseId) {
            this.changeFields.codebaseId = newCodebaseId;
        }
    }
}
exports.StylingChange = StylingChange;
class AddJsxChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        super(ChangeType.ADD_JSX, 'Add Element', changeFields, id);
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdToAddTo, beforeCodebaseId, afterCodebaseId, addCodebaseId, addNativeTag, fileContentsToSourceFrom, fileContentsSourceFilename, propsToSet, deletedStoryboardId, htmlForInstantUpdate, } = this.changeFields;
        const body = {
            destinationElement: treeElementLookup[codebaseIdToAddTo],
            beforeElement: treeElementLookup[beforeCodebaseId || ''],
            afterElement: treeElementLookup[afterCodebaseId || ''],
            newElement: {},
            canvasId: activeCanvas.id,
            deletedStoryboardId,
            fileContentsToSourceFrom,
            fileContentsSourceFilename,
        };
        if (addCodebaseId) {
            body.newElement = Object.assign({}, treeElementLookup[addCodebaseId]);
        }
        else if (addNativeTag) {
            body.newElement['type'] = 'native';
            body.newElement['nativeTag'] = addNativeTag;
            body.newElement['componentName'] = addNativeTag;
        }
        if (propsToSet) {
            body.newElement['propsToSet'] = propsToSet;
        }
        if (!Object.keys(body.newElement).length) {
            delete body.newElement;
        }
        const hasInstantUpdate = Boolean(htmlForInstantUpdate);
        body['hasInstantUpdate'] = hasInstantUpdate;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/addJsxElement`,
            body,
            // Only show the success message if we do not have instant updates
            successToastMessage: hasInstantUpdate ? undefined : 'Successfully added',
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        const fieldsToApply = [
            'codebaseIdToAddTo',
            'beforeCodebaseId',
            'afterCodebaseId',
            'addCodebaseId',
        ];
        fieldsToApply.forEach((field) => {
            // @ts-ignore
            const newCodebaseId = prevIdToNewIdMap[this.changeFields[field]];
            if (newCodebaseId) {
                // @ts-ignore
                this.changeFields[field] = newCodebaseId;
            }
        });
    }
}
exports.AddJsxChange = AddJsxChange;
class MoveJsxChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        super(ChangeType.MOVE_JSX, 'Move Element', changeFields, id);
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdToMoveTo, codebaseIdToMove, afterCodebaseId, beforeCodebaseId, expectedCurrentParentCodebaseId, } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/moveJsxElement`,
            body: {
                elementToMove: treeElementLookup[codebaseIdToMove],
                newContainerElement: treeElementLookup[codebaseIdToMoveTo],
                afterElement: treeElementLookup[afterCodebaseId || ''],
                beforeElement: treeElementLookup[beforeCodebaseId || ''],
                expectedCurrentParent: treeElementLookup[expectedCurrentParentCodebaseId || ''],
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        const fieldsToApply = [
            'codebaseIdToMoveTo',
            'codebaseIdToMove',
            'afterCodebaseId',
            'beforeCodebaseId',
            'expectedCurrentParentCodebaseId',
        ];
        fieldsToApply.forEach((field) => {
            // @ts-ignore
            const newCodebaseId = prevIdToNewIdMap[this.changeFields[field]];
            if (newCodebaseId) {
                // @ts-ignore
                this.changeFields[field] = newCodebaseId;
            }
        });
    }
}
exports.MoveJsxChange = MoveJsxChange;
class RemoveJsxChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        // Deduplicate the codebaseIdsToRemove
        changeFields.codebaseIdsToRemove = Array.from(new Set(changeFields.codebaseIdsToRemove));
        super(ChangeType.REMOVE_JSX, 'Delete Element', changeFields, id);
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdsToRemove } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/removeJsxElement`,
            body: {
                elementsToRemove: codebaseIdsToRemove
                    .map((codebaseId) => treeElementLookup[codebaseId])
                    .filter((element) => element),
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        this.changeFields.codebaseIdsToRemove =
            this.changeFields.codebaseIdsToRemove.map((codebaseId) => {
                const newCodebaseId = prevIdToNewIdMap[codebaseId];
                if (newCodebaseId) {
                    return newCodebaseId;
                }
                return codebaseId;
            });
    }
}
exports.RemoveJsxChange = RemoveJsxChange;
class ChangePropChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        super(ChangeType.CHANGE_PROP, 'Change Prop', changeFields, id);
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdToChange, propName, propValue } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/changePropValue`,
            body: {
                elementToModify: treeElementLookup[codebaseIdToChange],
                propName,
                propValue,
            },
            successToastMessage: 'Prop changed',
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        const newCodebaseId = prevIdToNewIdMap[this.changeFields.codebaseIdToChange];
        if (newCodebaseId) {
            this.changeFields.codebaseIdToChange = newCodebaseId;
        }
    }
}
exports.ChangePropChange = ChangePropChange;
class WrapDivChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        // Deduplicate the codebaseIdsToWrap
        changeFields.codebaseIdsToWrap = Array.from(new Set(changeFields.codebaseIdsToWrap));
        super(ChangeType.WRAP_DIV, 'Wrap In Div', changeFields, id);
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdsToWrap } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/wrapInDiv`,
            body: {
                reactElements: codebaseIdsToWrap.map((codebaseId) => treeElementLookup[codebaseId]),
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        this.changeFields.codebaseIdsToWrap =
            this.changeFields.codebaseIdsToWrap.map((codebaseId) => {
                const newCodebaseId = prevIdToNewIdMap[codebaseId];
                if (newCodebaseId) {
                    return newCodebaseId;
                }
                return codebaseId;
            });
    }
}
exports.WrapDivChange = WrapDivChange;
class DuplicateChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        // Deduplicate the codebaseIdsToDuplicate
        changeFields.codebaseIdsToDuplicate = Array.from(new Set(changeFields.codebaseIdsToDuplicate));
        super(ChangeType.DUPLICATE, 'Duplicate', changeFields, id);
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdsToDuplicate } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/duplicate`,
            body: {
                reactElements: codebaseIdsToDuplicate.map((codebaseId) => treeElementLookup[codebaseId]),
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        this.changeFields.codebaseIdsToDuplicate =
            this.changeFields.codebaseIdsToDuplicate.map((codebaseId) => {
                const newCodebaseId = prevIdToNewIdMap[codebaseId];
                if (newCodebaseId) {
                    return newCodebaseId;
                }
                return codebaseId;
            });
    }
}
exports.DuplicateChange = DuplicateChange;
class ChangeTagChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        super(ChangeType.CHANGE_TAG, 'Change Tag Name', changeFields, id);
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdToChange, newTagName } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/changeElementTag`,
            body: {
                elementToModify: treeElementLookup[codebaseIdToChange],
                newTag: newTagName,
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        const newCodebaseId = prevIdToNewIdMap[this.changeFields.codebaseIdToChange];
        if (newCodebaseId) {
            this.changeFields.codebaseIdToChange = newCodebaseId;
        }
    }
}
exports.ChangeTagChange = ChangeTagChange;
class AddClassChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        super(ChangeType.ADD_CLASS, 'Add Class', changeFields, id);
        this.canInstantUpdateWhileFlushing = true;
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdToAddClass, className, addingTailwindClass, modifiers, customProperties, } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/addClass`,
            body: {
                reactElement: treeElementLookup[codebaseIdToAddClass],
                className,
                stylingFramework: addingTailwindClass
                    ? StylingFramework.TAILWIND
                    : null,
                modifiers,
                customProperties,
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        const newCodebaseId = prevIdToNewIdMap[this.changeFields.codebaseIdToAddClass];
        if (newCodebaseId) {
            this.changeFields.codebaseIdToAddClass = newCodebaseId;
        }
    }
}
exports.AddClassChange = AddClassChange;
class RemoveClassChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        super(ChangeType.REMOVE_CLASS, 'Remove Class', changeFields, id);
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdToRemoveClass, className } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/removeClass`,
            body: {
                reactElement: treeElementLookup[codebaseIdToRemoveClass],
                className,
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        const newCodebaseId = prevIdToNewIdMap[this.changeFields.codebaseIdToRemoveClass];
        if (newCodebaseId) {
            this.changeFields.codebaseIdToRemoveClass = newCodebaseId;
        }
    }
}
exports.RemoveClassChange = RemoveClassChange;
class EditTextChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        super(ChangeType.EDIT_TEXT, 'Edit Text', changeFields, id);
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { codebaseIdToEditText, newText, oldText } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/mutate/editText`,
            body: {
                element: treeElementLookup[codebaseIdToEditText],
                newText,
                oldText,
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        const newCodebaseId = prevIdToNewIdMap[this.changeFields.codebaseIdToEditText];
        if (newCodebaseId) {
            this.changeFields.codebaseIdToEditText = newCodebaseId;
        }
    }
}
exports.EditTextChange = EditTextChange;
class UndoChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        var _a;
        super(ChangeType.UNDO, 'Undo', changeFields, id);
        if ((_a = changeFields.changeToUndo) === null || _a === void 0 ? void 0 : _a.canInstantUpdateWhileFlushing) {
            this.canInstantUpdateWhileFlushing = true;
        }
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { changeToUndo } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/activities/undoChangeToFiles`,
            body: {
                latestUuid: changeToUndo.activityId,
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        // Do nothing
    }
}
exports.UndoChange = UndoChange;
class RedoChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        var _a;
        super(ChangeType.REDO, 'Redo', changeFields, id);
        if ((_a = changeFields.changeToRedo) === null || _a === void 0 ? void 0 : _a.canInstantUpdateWhileFlushing) {
            this.canInstantUpdateWhileFlushing = true;
        }
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        const { changeToRedo } = this.changeFields;
        return {
            urlPath: `canvases/${canvasId}/parseAndMutate/activities/redoChangeToFiles`,
            body: {
                changeToRedoId: changeToRedo.activityId,
            },
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        // Do nothing
    }
}
exports.RedoChange = RedoChange;
class UnknownChange extends ChangeLedgerItem {
    constructor(changeFields, id) {
        super(ChangeType.UNKNOWN, '', changeFields, id);
        // Do not process unknown changes
        this.markProcessedSucceeded();
        this.doNotSendInstantUpdate();
    }
    prepareApiRequest(canvasId, treeElementLookup, activeCanvas) {
        throw Error('Unsupported operation');
        // For typing
        return {
            urlPath: ``,
            body: {},
        };
    }
    applyCodebaseIdChanges(prevIdToNewIdMap) {
        // Do nothing
    }
}
exports.UnknownChange = UnknownChange;
/**
 * When serializing a change ledger item to a plain JS object, the class functions
 * are lost. This recreates the change item that was lost
 */
const reconstructChangeLedgerClass = (plainJsObject) => {
    if (!plainJsObject || !plainJsObject.type) {
        return null;
    }
    const changeType = plainJsObject.type;
    const changeFields = plainJsObject.changeFields;
    const id = plainJsObject.id;
    const getChangeForType = () => {
        switch (changeType) {
            case ChangeType.STYLING:
                return new StylingChange(changeFields, id);
            case ChangeType.ADD_JSX:
                return new AddJsxChange(changeFields, id);
            case ChangeType.REMOVE_JSX:
                return new RemoveJsxChange(changeFields, id);
            case ChangeType.MOVE_JSX:
                return new MoveJsxChange(changeFields, id);
            case ChangeType.CHANGE_PROP:
                return new ChangePropChange(changeFields, id);
            case ChangeType.ADD_CLASS:
                return new AddClassChange(changeFields, id);
            case ChangeType.REMOVE_CLASS:
                return new RemoveClassChange(changeFields, id);
            case ChangeType.WRAP_DIV:
                return new WrapDivChange(changeFields, id);
            case ChangeType.CHANGE_TAG:
                return new ChangeTagChange(changeFields, id);
            case ChangeType.DUPLICATE:
                return new DuplicateChange(changeFields, id);
            case ChangeType.EDIT_TEXT:
                return new EditTextChange(changeFields, id);
            case ChangeType.UNDO:
                changeFields.changeToUndo = (0, exports.reconstructChangeLedgerClass)(changeFields.changeToUndo);
                return new UndoChange(changeFields, id);
            case ChangeType.REDO:
                changeFields.changeToRedo = (0, exports.reconstructChangeLedgerClass)(changeFields.changeToRedo);
                return new RedoChange(changeFields, id);
            case ChangeType.UNKNOWN:
                return new UnknownChange(changeFields, id);
            default:
                throw new Error(`Unknown change type: ${changeType}`);
        }
    };
    // Set all the other fields on the change object
    const change = getChangeForType();
    Object.keys(plainJsObject).forEach((key) => {
        if (['type', 'changeFields', 'id'].includes(key)) {
            return;
        }
        // @ts-ignore
        change[key] = plainJsObject[key];
    });
    return change;
};
exports.reconstructChangeLedgerClass = reconstructChangeLedgerClass;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlTGVkZ2VyVHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2hhbm5lbE1lc3NhZ2luZy9jaGFuZ2VMZWRnZXJUeXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpREFBOEM7QUFDOUMsK0JBQW9DO0FBRXBDLHFDQUFxQztBQUNyQyxJQUFZLGdCQUlYO0FBSkQsV0FBWSxnQkFBZ0I7SUFDMUIscUNBQWlCLENBQUE7SUFDakIsK0JBQVcsQ0FBQTtJQUNYLHlDQUFxQixDQUFBO0FBQ3ZCLENBQUMsRUFKVyxnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQUkzQjtBQU9ELElBQVksVUFlWDtBQWZELFdBQVksVUFBVTtJQUNwQixpQ0FBbUIsQ0FBQTtJQUNuQixpQ0FBbUIsQ0FBQTtJQUNuQixtQ0FBcUIsQ0FBQTtJQUNyQix1Q0FBeUIsQ0FBQTtJQUN6Qix5Q0FBMkIsQ0FBQTtJQUMzQixxQ0FBdUIsQ0FBQTtJQUN2QiwyQ0FBNkIsQ0FBQTtJQUM3QixxQ0FBdUIsQ0FBQTtJQUN2QixtQ0FBcUIsQ0FBQTtJQUNyQix1Q0FBeUIsQ0FBQTtJQUN6QixxQ0FBdUIsQ0FBQTtJQUN2QiwyQkFBYSxDQUFBO0lBQ2IsMkJBQWEsQ0FBQTtJQUNiLGlDQUFtQixDQUFBO0FBQ3JCLENBQUMsRUFmVyxVQUFVLDBCQUFWLFVBQVUsUUFlckI7QUFFRCwyRkFBMkY7QUFDOUUsUUFBQSw4QkFBOEIsR0FBRztJQUM1QyxVQUFVLENBQUMsVUFBVTtJQUNyQixVQUFVLENBQUMsU0FBUztJQUNwQixVQUFVLENBQUMsT0FBTztDQUNuQixDQUFDO0FBRUYsTUFBc0IsZ0JBQWdCO0lBbURwQyxZQUNFLElBQWdCLEVBQ2hCLFVBQWtCLEVBQ2xCLFlBQWUsRUFDZixFQUFXO1FBNUNOLHFCQUFnQixHQUFpQyxFQUFFLENBQUM7UUE4Q3pELElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLElBQUEsU0FBTSxHQUFFLENBQUM7UUFDekIs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QUFDO0FBQ2hCLENBQUMsQ0FBQztBQWhFVyxRQUFBLDRCQUE0QixnQ0FnRXZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVtcG9FbGVtZW50IH0gZnJvbSAnLi90ZW1wb0VsZW1lbnQnO1xuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5cbi8vIE1hdGNoZXMgdGhlIGZpbGUgaW4gdGVtcG8tZGV2dG9vbHNcbmV4cG9ydCBlbnVtIFN0eWxpbmdGcmFtZXdvcmsge1xuICBJTkxJTkUgPSAnSW5saW5lJyxcbiAgQ1NTID0gJ0NTUycsXG4gIFRBSUxXSU5EID0gJ1RhaWx3aW5kJyxcbn1cblxudHlwZSBDbGFzc1R5cGUgPSB7XG4gIHRhaWx3aW5kOiBzdHJpbmc7XG4gIGNzczogc3RyaW5nO1xufTtcblxuZXhwb3J0IGVudW0gQ2hhbmdlVHlwZSB7XG4gIFNUWUxJTkcgPSAnU1RZTElORycsXG4gIEFERF9KU1ggPSAnQUREX0pTWCcsXG4gIE1PVkVfSlNYID0gJ01PVkVfSlNYJyxcbiAgUkVNT1ZFX0pTWCA9ICdSRU1PVkVfSlNYJyxcbiAgQ0hBTkdFX1BST1AgPSAnQ0hBTkdFX1BST1AnLFxuICBBRERfQ0xBU1MgPSAnQUREX0NMQVNTJyxcbiAgUkVNT1ZFX0NMQVNTID0gJ1JFTU9WRV9DTEFTUycsXG4gIEVESVRfVEVYVCA9ICdFRElUX1RFWFQnLFxuICBXUkFQX0RJViA9ICdXUkFQX0RJVicsXG4gIENIQU5HRV9UQUcgPSAnQ0hBTkdFX1RBRycsXG4gIERVUExJQ0FURSA9ICdEVVBMSUNBVEUnLFxuICBVTkRPID0gJ1VORE8nLFxuICBSRURPID0gJ1JFRE8nLFxuICBVTktOT1dOID0gJ1VOS05PV04nLFxufVxuXG4vLyBNYWtlIHN1cmUgdG8gbWF0Y2ggdGhpcyBpbiBib3RoIHRlbXBvLWRldnRvb2xzICYgKiogdGVtcG8tYXBpICoqIChpbiB0aGUgdW5kby9yZWRvIGZpbGUpXG5leHBvcnQgY29uc3QgQ0hBTkdFX1RZUEVTX1dJVEhfSU5TVEFOVF9VTkRPID0gW1xuICBDaGFuZ2VUeXBlLlJFTU9WRV9KU1gsXG4gIENoYW5nZVR5cGUuQUREX0NMQVNTLFxuICBDaGFuZ2VUeXBlLlNUWUxJTkcsXG5dO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ2hhbmdlTGVkZ2VySXRlbTxUPiB7XG4gIHB1YmxpYyBpZDogc3RyaW5nO1xuICBwdWJsaWMgdHlwZTogQ2hhbmdlVHlwZTtcbiAgcHVibGljIGNoYW5nZU5hbWU6IHN0cmluZztcbiAgcHVibGljIGluZGV4SW5MZWRnZXI/OiBudW1iZXI7XG4gIHB1YmxpYyBjaGFuZ2VGaWVsZHM6IFQ7XG5cbiAgcHVibGljIGNhbkluc3RhbnRVcGRhdGVXaGlsZUZsdXNoaW5nOiBib29sZWFuO1xuXG4gIC8vIFRoZXNlIHR3byBmaWVsZHMgYXJlIHNldCBhZnRlciB0aGUgQVBJIHJlcXVlc3QgY29tcGxldGVzXG4gIHB1YmxpYyBhY3Rpdml0eUlkPzogc3RyaW5nO1xuICBwdWJsaWMgcHJldklkVG9OZXdJZE1hcDogeyBbcHJldklkOiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuXG4gIHB1YmxpYyBjaGFuZ2VVbmRvbmU/OiBib29sZWFuO1xuICBwdWJsaWMgdG9hc3RJZD86IHN0cmluZyB8IG51bWJlcjtcblxuICBwcml2YXRlIF9jb25zdW1lZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfZmFpbGVkOiBib29sZWFuO1xuXG4gIHByaXZhdGUgX2luc3RhbnRVcGRhdGVTZW50OiBib29sZWFuO1xuICBwcml2YXRlIF9pbnN0YW50VXBkYXRlRmluaXNoZWQ6IGJvb2xlYW47XG4gIHByaXZhdGUgX2luc3RhbnRVcGRhdGVTdWNjZXNzZnVsOiBib29sZWFuO1xuICBwcml2YXRlIF9zZW5kSW5zdGFudFVwZGF0ZTogYm9vbGVhbjtcblxuICAvLyBFeHRyYSBkYXRhIGdpdmVuIGFmdGVyIHRoZSBpbnN0YW50IHVwZGF0ZSAoZS5nLiB0aGUgaW5uZXIgSFRNTCBmb3IgZGVsZXRlZCBlbGVtZW50cylcbiAgcHJpdmF0ZSBfaW5zdGFudFVwZGF0ZURhdGE/OiBhbnk7XG5cbiAgLy8gQWZ0ZXIgaW5zdGFudCB1cGRhdGUsIHdoaWNoIHNlbGVjdGVkIGVsZW1lbnQga2V5ICYgbXVsdGlzZWxlY3RlZCBlbGVtZW50IGtleXMgdG8gc2V0XG4gIC8vIE5vdGUgLT4gd2UgYXJlIG5vdCB1c2luZyBjYWxsYmFja3MgZm9yIHRoZSB1bmRvIGluc3RhbnQgdXBkYXRlIGJlY2F1c2Ugd2Ugc3RvcmUgdGhpcyBpblxuICAvLyBsb2NhbCBzdG9yYWdlIHRoZW4gZGVzZXJpYWxpemUgaXQsIHNvIHRoZSBjYWxsYmFja3MgYXJlIGxvc3RcbiAgLy8gQWxzbyBOb3RlIC0+IHRoZXNlIGVsZW1lbnQga2V5cyBhcmUgc2VsZWN0ZWQgZXhwbGljaXRseSBpbiB0ZW1wby1kZXZ0b29sc1xuICAvLyB3aGVyZSB0aGUgaW5zdGFudCB1cGRhdGVzIGFyZSBwZXJmb3JtZWQgKGNoYW5nZSBpdGVtIGZ1bmN0aW9ucylcblxuICAvLyBGb3IgaW5zdGFudCB1cGRhdGVcbiAgLy8gTnVsbCB3aWxsIGJlIHNldCwgd2hpbGUgdW5kZWZpbmVkIHdpbGwgYmUgaWdub3JlZFxuICBwcml2YXRlIGVsZW1lbnRLZXlUb1NlbGVjdEFmdGVySW5zdGFudFVwZGF0ZT86IHN0cmluZyB8IG51bGw7XG4gIHByaXZhdGUgZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlPzogc3RyaW5nW10gfCBudWxsO1xuXG4gIC8vIEZvciB1bmRvIGluc3RhbnQgdXBkYXRlXG4gIC8vIE51bGwgd2lsbCBiZSBzZXQsIHdoaWxlIHVuZGVmaW5lZCB3aWxsIGJlIGlnbm9yZWRcbiAgcHJpdmF0ZSBlbGVtZW50S2V5VG9TZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlPzogc3RyaW5nIHwgbnVsbDtcbiAgcHJpdmF0ZSBlbGVtZW50S2V5c1RvTXVsdGlzZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlPzogc3RyaW5nW10gfCBudWxsO1xuXG4gIC8vIFJlc29sdmVycyBhZnRlciBBUEkgY2FsbFxuXG4gIHByaXZhdGUgX3Jlc29sdmVBcGk/OiAoZGF0YT86IGFueSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBfcmVqZWN0QXBpPzogKHJlYXNvbj86IGFueSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBfYXBpUmVqZWN0aW9uQWRkZWQ/OiBib29sZWFuO1xuXG4gIHByaXZhdGUgX2FwaVByb21pc2U6IFByb21pc2U8dm9pZD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgdHlwZTogQ2hhbmdlVHlwZSxcbiAgICBjaGFuZ2VOYW1lOiBzdHJpbmcsXG4gICAgY2hhbmdlRmllbGRzOiBULFxuICAgIGlkPzogc3RyaW5nLFxuICApIHtcbiAgICB0aGlzLmlkID0gaWQgfHwgdXVpZHY0KCk7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmNoYW5nZUZpZWxkcyA9IGNoYW5nZUZpZWxkcztcbiAgICB0aGlzLmNoYW5nZU5hbWUgPSBjaGFuZ2VOYW1lO1xuICAgIHRoaXMuX2NvbnN1bWVkID0gZmFsc2U7XG4gICAgdGhpcy5fZmFpbGVkID0gZmFsc2U7XG4gICAgdGhpcy5faW5zdGFudFVwZGF0ZVNlbnQgPSBmYWxzZTtcbiAgICB0aGlzLl9pbnN0YW50VXBkYXRlRmluaXNoZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9pbnN0YW50VXBkYXRlU3VjY2Vzc2Z1bCA9IGZhbHNlO1xuICAgIHRoaXMuX3NlbmRJbnN0YW50VXBkYXRlID0gdHJ1ZTtcbiAgICB0aGlzLmNhbkluc3RhbnRVcGRhdGVXaGlsZUZsdXNoaW5nID0gZmFsc2U7XG5cbiAgICB0aGlzLl9hcGlQcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5fcmVzb2x2ZUFwaSA9IHJlc29sdmU7XG4gICAgICB0aGlzLl9yZWplY3RBcGkgPSByZWplY3Q7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgcmVzb2x2ZUFwaShkYXRhPzogYW55KSB7XG4gICAgdGhpcy5fcmVzb2x2ZUFwaT8uKGRhdGEpO1xuICB9XG5cbiAgcHVibGljIHJlamVjdEFwaShyZWFzb24/OiBhbnkpIHtcbiAgICBpZiAodGhpcy5fYXBpUmVqZWN0aW9uQWRkZWQpIHtcbiAgICAgIHRoaXMuX3JlamVjdEFwaT8uKHJlYXNvbik7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIG5lZWRzVG9TZW5kSW5zdGFudFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gIXRoaXMuX2luc3RhbnRVcGRhdGVTZW50ICYmIHRoaXMuX3NlbmRJbnN0YW50VXBkYXRlO1xuICB9XG5cbiAgcHVibGljIG1hcmtJbnN0YW50VXBkYXRlU2VudCgpIHtcbiAgICB0aGlzLl9pbnN0YW50VXBkYXRlU2VudCA9IHRydWU7XG4gIH1cblxuICBwdWJsaWMgbWFya0luc3RhbnRVcGRhdGVGaW5pc2hlZChcbiAgICBpbnN0YW50VXBkYXRlRGF0YTogYW55LFxuICAgIGluc3RhbnRVcGRhdGVTdWNjZXNzZnVsOiBib29sZWFuLFxuICApIHtcbiAgICB0aGlzLl9pbnN0YW50VXBkYXRlRmluaXNoZWQgPSB0cnVlO1xuICAgIHRoaXMuX2luc3RhbnRVcGRhdGVTdWNjZXNzZnVsID0gaW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWw7XG4gICAgdGhpcy5faW5zdGFudFVwZGF0ZURhdGEgPSBpbnN0YW50VXBkYXRlRGF0YTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRJbnN0YW50VXBkYXRlRGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5faW5zdGFudFVwZGF0ZURhdGE7XG4gIH1cblxuICBwdWJsaWMgd2FzSW5zdGFudFVwZGF0ZVN1Y2Nlc3NmdWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbnRVcGRhdGVTdWNjZXNzZnVsO1xuICB9XG5cbiAgcHVibGljIGlzSW5zdGFudFVwZGF0ZUZpbmlzaGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnN0YW50VXBkYXRlRmluaXNoZWQ7XG4gIH1cblxuICBwdWJsaWMgbWFya1Byb2Nlc3NlZFN1Y2NlZWRlZCgpIHtcbiAgICB0aGlzLl9jb25zdW1lZCA9IHRydWU7XG4gIH1cblxuICBwdWJsaWMgbWFya1Byb2Nlc3NlZEZhaWxlZCgpIHtcbiAgICB0aGlzLl9mYWlsZWQgPSB0cnVlO1xuICAgIHRoaXMuX2NvbnN1bWVkID0gdHJ1ZTtcbiAgfVxuXG4gIHB1YmxpYyBpc0ZhaWxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZmFpbGVkO1xuICB9XG5cbiAgcHVibGljIG5lZWRUb1Byb2Nlc3NDaGFuZ2UoKSB7XG4gICAgcmV0dXJuICF0aGlzLl9jb25zdW1lZDtcbiAgfVxuXG4gIHB1YmxpYyBvbkFwaVJlc29sdmUob25GdWxmaWxsZWQ6IChkYXRhPzogYW55KSA9PiB2b2lkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FwaVByb21pc2UudGhlbihvbkZ1bGZpbGxlZCk7XG4gIH1cblxuICBwdWJsaWMgb25BcGlSZWplY3Qob25SZWplY3RlZDogKHJlYXNvbj86IGFueSkgPT4gdm9pZCkge1xuICAgIHRoaXMuX2FwaVJlamVjdGlvbkFkZGVkID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5fYXBpUHJvbWlzZS5jYXRjaChvblJlamVjdGVkKTtcbiAgfVxuXG4gIGFic3RyYWN0IHByZXBhcmVBcGlSZXF1ZXN0KFxuICAgIGNhbnZhc0lkOiBzdHJpbmcsXG4gICAgdHJlZUVsZW1lbnRMb29rdXA6IHsgW2NvZGViYXNlSWQ6IHN0cmluZ106IGFueSB9LFxuICAgIGFjdGl2ZUNhbnZhczogYW55LFxuICApOiB7XG4gICAgdXJsUGF0aDogc3RyaW5nO1xuICAgIGJvZHk6IHtcbiAgICAgIFtrZXk6IHN0cmluZ106IGFueTtcbiAgICB9O1xuICAgIHN1Y2Nlc3NUb2FzdE1lc3NhZ2U/OiBzdHJpbmc7XG4gIH07XG5cbiAgcHVibGljIGRvTm90U2VuZEluc3RhbnRVcGRhdGUoKSB7XG4gICAgdGhpcy5fc2VuZEluc3RhbnRVcGRhdGUgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIEZvciBzZWxlY3RpbmcvZGVzbGVjdGluZyBuZXcgZWxlbWVudHMgYWZ0ZXIgaW5zdGFudCB1cGRhdGVzXG5cbiAgcHVibGljIGNsZWFyU2VsZWN0ZWRFbGVtZW50c0FmdGVySW5zdGFudFVwZGF0ZSgpIHtcbiAgICB0aGlzLmVsZW1lbnRLZXlUb1NlbGVjdEFmdGVySW5zdGFudFVwZGF0ZSA9IG51bGw7XG4gICAgdGhpcy5lbGVtZW50S2V5c1RvTXVsdGlzZWxlY3RBZnRlckluc3RhbnRVcGRhdGUgPSBudWxsO1xuICB9XG5cbiAgcHVibGljIHNldFNlbGVjdGVkRWxlbWVudHNBZnRlckluc3RhbnRVcGRhdGUoXG4gICAgc2VsZWN0ZWRFbGVtZW50S2V5OiBzdHJpbmcsXG4gICAgbXVsdGlzZWxlY3RlZEVsZW1lbnRLZXlzOiBzdHJpbmdbXSxcbiAgKSB7XG4gICAgdGhpcy5lbGVtZW50S2V5VG9TZWxlY3RBZnRlckluc3RhbnRVcGRhdGUgPSBzZWxlY3RlZEVsZW1lbnRLZXk7XG4gICAgdGhpcy5lbGVtZW50S2V5c1RvTXVsdGlzZWxlY3RBZnRlckluc3RhbnRVcGRhdGUgPSBtdWx0aXNlbGVjdGVkRWxlbWVudEtleXM7XG4gIH1cblxuICBwdWJsaWMgY2xlYXJTZWxlY3RlZEVsZW1lbnRzQWZ0ZXJVbmRvSW5zdGFudFVwZGF0ZSgpIHtcbiAgICB0aGlzLmVsZW1lbnRLZXlUb1NlbGVjdEFmdGVyVW5kb0luc3RhbnRVcGRhdGUgPSBudWxsO1xuICAgIHRoaXMuZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJVbmRvSW5zdGFudFVwZGF0ZSA9IG51bGw7XG4gIH1cblxuICBwdWJsaWMgc2V0U2VsZWN0ZWRFbGVtZW50c0FmdGVyVW5kb0luc3RhbnRVcGRhdGUoXG4gICAgc2VsZWN0ZWRFbGVtZW50S2V5OiBzdHJpbmcsXG4gICAgbXVsdGlzZWxlY3RlZEVsZW1lbnRLZXlzOiBzdHJpbmdbXSxcbiAgKSB7XG4gICAgdGhpcy5lbGVtZW50S2V5VG9TZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlID0gc2VsZWN0ZWRFbGVtZW50S2V5O1xuICAgIHRoaXMuZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJVbmRvSW5zdGFudFVwZGF0ZSA9XG4gICAgICBtdWx0aXNlbGVjdGVkRWxlbWVudEtleXM7XG4gIH1cblxuICBwdWJsaWMgZ2V0RWxlbWVudEtleVRvU2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnRLZXlUb1NlbGVjdEFmdGVySW5zdGFudFVwZGF0ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRFbGVtZW50S2V5c1RvTXVsdGlzZWxlY3RBZnRlckluc3RhbnRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlO1xuICB9XG5cbiAgcHVibGljIGdldEVsZW1lbnRLZXlUb1NlbGVjdEFmdGVyVW5kb0luc3RhbnRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudEtleVRvU2VsZWN0QWZ0ZXJVbmRvSW5zdGFudFVwZGF0ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRFbGVtZW50S2V5c1RvTXVsdGlzZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnRLZXlzVG9NdWx0aXNlbGVjdEFmdGVyVW5kb0luc3RhbnRVcGRhdGU7XG4gIH1cblxuICBhYnN0cmFjdCBhcHBseUNvZGViYXNlSWRDaGFuZ2VzKHByZXZJZFRvTmV3SWRNYXA6IHtcbiAgICBbcHJldklkOiBzdHJpbmddOiBzdHJpbmc7XG4gIH0pOiB2b2lkO1xuXG4gIHB1YmxpYyBhcHBseUFsbENvZGViYXNlSWRDaGFuZ2VzKHByZXZJZFRvTmV3SWRNYXA6IHtcbiAgICBbcHJldklkOiBzdHJpbmddOiBzdHJpbmc7XG4gIH0pIHtcbiAgICBjb25zdCBnZXROZXdLZXkgPSAocHJldktleTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoIXByZXZLZXkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRlbXBvRWxlbWVudCA9IFRlbXBvRWxlbWVudC5mcm9tS2V5KHByZXZLZXkpO1xuICAgICAgY29uc3QgY29kZWJhc2VJZCA9IHRlbXBvRWxlbWVudC5jb2RlYmFzZUlkO1xuICAgICAgY29uc3QgbmV3Q29kZWJhc2VJZCA9IHByZXZJZFRvTmV3SWRNYXBbY29kZWJhc2VJZF07XG5cbiAgICAgIGlmIChuZXdDb2RlYmFzZUlkKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGVtcG9FbGVtZW50KFxuICAgICAgICAgIG5ld0NvZGViYXNlSWQsXG4gICAgICAgICAgdGVtcG9FbGVtZW50LnN0b3J5Ym9hcmRJZCxcbiAgICAgICAgICB0ZW1wb0VsZW1lbnQudW5pcXVlUGF0aCxcbiAgICAgICAgKS5nZXRLZXkoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcblxuICAgIC8qXG4gICAgICogSW5zdGFudCB1cGRhdGUgZmllbGRzXG4gICAgICovXG5cbiAgICBpZiAodGhpcy5lbGVtZW50S2V5VG9TZWxlY3RBZnRlckluc3RhbnRVcGRhdGUpIHtcbiAgICAgIGNvbnN0IG5ld0VsZW1lbnRLZXkgPSBnZXROZXdLZXkoXG4gICAgICAgIHRoaXMuZWxlbWVudEtleVRvU2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlLFxuICAgICAgKTtcbiAgICAgIHRoaXMuZWxlbWVudEtleVRvU2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlID1cbiAgICAgICAgbmV3RWxlbWVudEtleSB8fCB0aGlzLmVsZW1lbnRLZXlUb1NlbGVjdEFmdGVySW5zdGFudFVwZGF0ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lbGVtZW50S2V5c1RvTXVsdGlzZWxlY3RBZnRlckluc3RhbnRVcGRhdGUpIHtcbiAgICAgIHRoaXMuZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJJbnN0YW50VXBkYXRlID1cbiAgICAgICAgdGhpcy5lbGVtZW50S2V5c1RvTXVsdGlzZWxlY3RBZnRlckluc3RhbnRVcGRhdGU/Lm1hcCgoa2V5KSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3S2V5ID0gZ2V0TmV3S2V5KGtleSk7XG4gICAgICAgICAgcmV0dXJuIG5ld0tleSB8fCBrZXk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qXG4gICAgICogVW5kbyBpbnN0YW50IHVwZGF0ZSBmaWVsZHNcbiAgICAgKi9cbiAgICBpZiAodGhpcy5lbGVtZW50S2V5VG9TZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlKSB7XG4gICAgICBjb25zdCBuZXdFbGVtZW50S2V5ID0gZ2V0TmV3S2V5KFxuICAgICAgICB0aGlzLmVsZW1lbnRLZXlUb1NlbGVjdEFmdGVyVW5kb0luc3RhbnRVcGRhdGUsXG4gICAgICApO1xuICAgICAgdGhpcy5lbGVtZW50S2V5VG9TZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlID1cbiAgICAgICAgbmV3RWxlbWVudEtleSB8fCB0aGlzLmVsZW1lbnRLZXlUb1NlbGVjdEFmdGVyVW5kb0luc3RhbnRVcGRhdGU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWxlbWVudEtleXNUb011bHRpc2VsZWN0QWZ0ZXJVbmRvSW5zdGFudFVwZGF0ZSkge1xuICAgICAgdGhpcy5lbGVtZW50S2V5c1RvTXVsdGlzZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlID1cbiAgICAgICAgdGhpcy5lbGVtZW50S2V5c1RvTXVsdGlzZWxlY3RBZnRlclVuZG9JbnN0YW50VXBkYXRlPy5tYXAoKGtleSkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld0tleSA9IGdldE5ld0tleShrZXkpO1xuICAgICAgICAgIHJldHVybiBuZXdLZXkgfHwga2V5O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmFwcGx5Q29kZWJhc2VJZENoYW5nZXMocHJldklkVG9OZXdJZE1hcCk7XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogU3R5bGluZyBDaGFuZ2VcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGluZ0NoYW5nZUZpZWxkcyB7XG4gIGNvZGViYXNlSWQ6IHN0cmluZztcbiAgc3R5bGluZ0NoYW5nZXM6IHsgW2Nzc0tleTogc3RyaW5nXTogc3RyaW5nIH07XG5cbiAgLy8gQ3VycmVudGx5IG9ubHkgb25lIHN1cHBvcnRlZFxuICBzdHlsaW5nRnJhbWV3b3JrOiBTdHlsaW5nRnJhbWV3b3JrLlRBSUxXSU5EO1xuICBtb2RpZmllcnM6IHN0cmluZ1tdO1xuICBjdXN0b21Qcm9wZXJ0aWVzOiBDbGFzc1R5cGVbXTtcbn1cblxuZXhwb3J0IGNsYXNzIFN0eWxpbmdDaGFuZ2UgZXh0ZW5kcyBDaGFuZ2VMZWRnZXJJdGVtPFN0eWxpbmdDaGFuZ2VGaWVsZHM+IHtcbiAgY29uc3RydWN0b3IoY2hhbmdlRmllbGRzOiBTdHlsaW5nQ2hhbmdlRmllbGRzLCBpZD86IHN0cmluZykge1xuICAgIHN1cGVyKENoYW5nZVR5cGUuU1RZTElORywgJ1N0eWxpbmcnLCBjaGFuZ2VGaWVsZHMsIGlkKTtcblxuICAgIC8vIEFsbG93IGluc3RhbnQgdXBkYXRlcyB3aGlsZSBmbHVzaGluZ1xuICAgIHRoaXMuY2FuSW5zdGFudFVwZGF0ZVdoaWxlRmx1c2hpbmcgPSB0cnVlO1xuICB9XG5cbiAgcHVibGljIHByZXBhcmVBcGlSZXF1ZXN0KFxuICAgIGNhbnZhc0lkOiBzdHJpbmcsXG4gICAgdHJlZUVsZW1lbnRMb29rdXA6IHsgW2NvZGViYXNlSWQ6IHN0cmluZ106IGFueSB9LFxuICAgIGFjdGl2ZUNhbnZhczogYW55LFxuICApIHtcbiAgICBjb25zdCB7XG4gICAgICBjb2RlYmFzZUlkLFxuICAgICAgc3R5bGluZ0NoYW5nZXMsXG4gICAgICBzdHlsaW5nRnJhbWV3b3JrLFxuICAgICAgbW9kaWZpZXJzLFxuICAgICAgY3VzdG9tUHJvcGVydGllcyxcbiAgICB9ID0gdGhpcy5jaGFuZ2VGaWVsZHM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsUGF0aDogYGNhbnZhc2VzLyR7Y2FudmFzSWR9L3BhcnNlQW5kTXV0YXRlL211dGF0ZS9zdHlsaW5nYCxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgcmVhY3RFbGVtZW50OiB0cmVlRWxlbWVudExvb2t1cFtjb2RlYmFzZUlkXSxcbiAgICAgICAgc3R5bGluZzogc3R5bGluZ0NoYW5nZXMsXG4gICAgICAgIHN0eWxpbmdGcmFtZXdvcmssXG4gICAgICAgIG1vZGlmaWVycyxcbiAgICAgICAgY3VzdG9tUHJvcGVydGllcyxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHB1YmxpYyBhcHBseUNvZGViYXNlSWRDaGFuZ2VzKHByZXZJZFRvTmV3SWRNYXA6IHtcbiAgICBbcHJldklkOiBzdHJpbmddOiBzdHJpbmc7XG4gIH0pIHtcbiAgICBjb25zdCBuZXdDb2RlYmFzZUlkID0gcHJldklkVG9OZXdJZE1hcFt0aGlzLmNoYW5nZUZpZWxkcy5jb2RlYmFzZUlkXTtcblxuICAgIGlmIChuZXdDb2RlYmFzZUlkKSB7XG4gICAgICB0aGlzLmNoYW5nZUZpZWxkcy5jb2RlYmFzZUlkID0gbmV3Q29kZWJhc2VJZDtcbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogQWRkIEpzeCBDaGFuZ2VcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmV4cG9ydCBpbnRlcmZhY2UgQWRkSnN4Q2hhbmdlRmllbGRzIHtcbiAgY29kZWJhc2VJZFRvQWRkVG86IHN0cmluZztcbiAgYmVmb3JlQ29kZWJhc2VJZD86IHN0cmluZztcbiAgYWZ0ZXJDb2RlYmFzZUlkPzogc3RyaW5nO1xuXG4gIC8vIFRoZSBlbGVtZW50IHRvIGFkZFxuICBhZGRDb2RlYmFzZUlkPzogc3RyaW5nO1xuICBhZGROYXRpdmVUYWc/OiBzdHJpbmc7XG4gIGZpbGVDb250ZW50c1RvU291cmNlRnJvbT86IHN0cmluZztcbiAgZmlsZUNvbnRlbnRzU291cmNlRmlsZW5hbWU/OiBzdHJpbmc7XG5cbiAgcHJvcHNUb1NldD86IHsgW2tleTogc3RyaW5nXTogYW55IH07XG5cbiAgLy8gVXNlZCB0byB0cmFjayB0aGUgc3Rvcnlib2FyZCBpbiBhY3Rpdml0eSBzdHJlYW1cbiAgZGVsZXRlZFN0b3J5Ym9hcmRJZD86IHN0cmluZztcblxuICAvLyBGb3IgaW5zdGFudCB1cGRhdGVcbiAgaHRtbEZvckluc3RhbnRVcGRhdGU/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBBZGRKc3hDaGFuZ2UgZXh0ZW5kcyBDaGFuZ2VMZWRnZXJJdGVtPEFkZEpzeENoYW5nZUZpZWxkcz4ge1xuICBjb25zdHJ1Y3RvcihjaGFuZ2VGaWVsZHM6IEFkZEpzeENoYW5nZUZpZWxkcywgaWQ/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihDaGFuZ2VUeXBlLkFERF9KU1gsICdBZGQgRWxlbWVudCcsIGNoYW5nZUZpZWxkcywgaWQpO1xuICB9XG5cbiAgcHVibGljIHByZXBhcmVBcGlSZXF1ZXN0KFxuICAgIGNhbnZhc0lkOiBzdHJpbmcsXG4gICAgdHJlZUVsZW1lbnRMb29rdXA6IHsgW2NvZGViYXNlSWQ6IHN0cmluZ106IGFueSB9LFxuICAgIGFjdGl2ZUNhbnZhczogYW55LFxuICApIHtcbiAgICBjb25zdCB7XG4gICAgICBjb2RlYmFzZUlkVG9BZGRUbyxcbiAgICAgIGJlZm9yZUNvZGViYXNlSWQsXG4gICAgICBhZnRlckNvZGViYXNlSWQsXG4gICAgICBhZGRDb2RlYmFzZUlkLFxuICAgICAgYWRkTmF0aXZlVGFnLFxuICAgICAgZmlsZUNvbnRlbnRzVG9Tb3VyY2VGcm9tLFxuICAgICAgZmlsZUNvbnRlbnRzU291cmNlRmlsZW5hbWUsXG4gICAgICBwcm9wc1RvU2V0LFxuICAgICAgZGVsZXRlZFN0b3J5Ym9hcmRJZCxcbiAgICAgIGh0bWxGb3JJbnN0YW50VXBkYXRlLFxuICAgIH0gPSB0aGlzLmNoYW5nZUZpZWxkcztcblxuICAgIGNvbnN0IGJvZHk6IGFueSA9IHtcbiAgICAgIGRlc3RpbmF0aW9uRWxlbWVudDogdHJlZUVsZW1lbnRMb29rdXBbY29kZWJhc2VJZFRvQWRkVG9dLFxuICAgICAgYmVmb3JlRWxlbWVudDogdHJlZUVsZW1lbnRMb29rdXBbYmVmb3JlQ29kZWJhc2VJZCB8fCAnJ10sXG4gICAgICBhZnRlckVsZW1lbnQ6IHRyZWVFbGVtZW50TG9va3VwW2FmdGVyQ29kZWJhc2VJZCB8fCAnJ10sXG4gICAgICBuZXdFbGVtZW50OiB7fSxcbiAgICAgIGNhbnZhc0lkOiBhY3RpdmVDYW52YXMuaWQsXG4gICAgICBkZWxldGVkU3Rvcnlib2FyZElkLFxuICAgICAgZmlsZUNvbnRlbnRzVG9Tb3VyY2VGcm9tLFxuICAgICAgZmlsZUNvbnRlbnRzU291cmNlRmlsZW5hbWUsXG4gICAgfTtcblxuICAgIGlmIChhZGRDb2RlYmFzZUlkKSB7XG4gICAgICBib2R5Lm5ld0VsZW1lbnQgPSB7XG4gICAgICAgIC4uLnRyZWVFbGVtZW50TG9va3VwW2FkZENvZGViYXNlSWRdLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGFkZE5hdGl2ZVRhZykge1xuICAgICAgYm9keS5uZXdFbGVtZW50Wyd0eXBlJ10gPSAnbmF0aXZlJztcbiAgICAgIGJvZHkubmV3RWxlbWVudFsnbmF0aXZlVGFnJ10gPSBhZGROYXRpdmVUYWc7XG4gICAgICBib2R5Lm5ld0VsZW1lbnRbJ2NvbXBvbmVudE5hbWUnXSA9IGFkZE5hdGl2ZVRhZztcbiAgICB9XG5cbiAgICBpZiAocHJvcHNUb1NldCkge1xuICAgICAgYm9keS5uZXdFbGVtZW50Wydwcm9wc1RvU2V0J10gPSBwcm9wc1RvU2V0O1xuICAgIH1cblxuICAgIGlmICghT2JqZWN0LmtleXMoYm9keS5uZXdFbGVtZW50KS5sZW5ndGgpIHtcbiAgICAgIGRlbGV0ZSBib2R5Lm5ld0VsZW1lbnQ7XG4gICAgfVxuXG4gICAgY29uc3QgaGFzSW5zdGFudFVwZGF0ZSA9IEJvb2xlYW4oaHRtbEZvckluc3RhbnRVcGRhdGUpO1xuICAgIGJvZHlbJ2hhc0luc3RhbnRVcGRhdGUnXSA9IGhhc0luc3RhbnRVcGRhdGU7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsUGF0aDogYGNhbnZhc2VzLyR7Y2FudmFzSWR9L3BhcnNlQW5kTXV0YXRlL211dGF0ZS9hZGRKc3hFbGVtZW50YCxcbiAgICAgIGJvZHksXG5cbiAgICAgIC8vIE9ubHkgc2hvdyB0aGUgc3VjY2VzcyBtZXNzYWdlIGlmIHdlIGRvIG5vdCBoYXZlIGluc3RhbnQgdXBkYXRlc1xuICAgICAgc3VjY2Vzc1RvYXN0TWVzc2FnZTogaGFzSW5zdGFudFVwZGF0ZSA/IHVuZGVmaW5lZCA6ICdTdWNjZXNzZnVsbHkgYWRkZWQnLFxuICAgIH07XG4gIH1cblxuICBwdWJsaWMgYXBwbHlDb2RlYmFzZUlkQ2hhbmdlcyhwcmV2SWRUb05ld0lkTWFwOiB7XG4gICAgW3ByZXZJZDogc3RyaW5nXTogc3RyaW5nO1xuICB9KSB7XG4gICAgY29uc3QgZmllbGRzVG9BcHBseSA9IFtcbiAgICAgICdjb2RlYmFzZUlkVG9BZGRUbycsXG4gICAgICAnYmVmb3JlQ29kZWJhc2VJZCcsXG4gICAgICAnYWZ0ZXJDb2RlYmFzZUlkJyxcbiAgICAgICdhZGRDb2RlYmFzZUlkJyxcbiAgICBdO1xuXG4gICAgZmllbGRzVG9BcHBseS5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgbmV3Q29kZWJhc2VJZCA9IHByZXZJZFRvTmV3SWRNYXBbdGhpcy5jaGFuZ2VGaWVsZHNbZmllbGRdXTtcblxuICAgICAgaWYgKG5ld0NvZGViYXNlSWQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmNoYW5nZUZpZWxkc1tmaWVsZF0gPSBuZXdDb2RlYmFzZUlkO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vdmUgSlNYIENoYW5nZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuZXhwb3J0IGludGVyZmFjZSBNb3ZlSnN4Q2hhbmdlRmllbGRzIHtcbiAgY29kZWJhc2VJZFRvTW92ZVRvOiBzdHJpbmc7XG4gIGNvZGViYXNlSWRUb01vdmU6IHN0cmluZztcbiAgYWZ0ZXJDb2RlYmFzZUlkPzogc3RyaW5nO1xuICBiZWZvcmVDb2RlYmFzZUlkPzogc3RyaW5nO1xuXG4gIGV4cGVjdGVkQ3VycmVudFBhcmVudENvZGViYXNlSWQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBNb3ZlSnN4Q2hhbmdlIGV4dGVuZHMgQ2hhbmdlTGVkZ2VySXRlbTxNb3ZlSnN4Q2hhbmdlRmllbGRzPiB7XG4gIGNvbnN0cnVjdG9yKGNoYW5nZUZpZWxkczogTW92ZUpzeENoYW5nZUZpZWxkcywgaWQ/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihDaGFuZ2VUeXBlLk1PVkVfSlNYLCAnTW92ZSBFbGVtZW50JywgY2hhbmdlRmllbGRzLCBpZCk7XG4gIH1cblxuICBwdWJsaWMgcHJlcGFyZUFwaVJlcXVlc3QoXG4gICAgY2FudmFzSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gICAgYWN0aXZlQ2FudmFzOiBhbnksXG4gICkge1xuICAgIGNvbnN0IHtcbiAgICAgIGNvZGViYXNlSWRUb01vdmVUbyxcbiAgICAgIGNvZGViYXNlSWRUb01vdmUsXG4gICAgICBhZnRlckNvZGViYXNlSWQsXG4gICAgICBiZWZvcmVDb2RlYmFzZUlkLFxuICAgICAgZXhwZWN0ZWRDdXJyZW50UGFyZW50Q29kZWJhc2VJZCxcbiAgICB9ID0gdGhpcy5jaGFuZ2VGaWVsZHM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsUGF0aDogYGNhbnZhc2VzLyR7Y2FudmFzSWR9L3BhcnNlQW5kTXV0YXRlL211dGF0ZS9tb3ZlSnN4RWxlbWVudGAsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGVsZW1lbnRUb01vdmU6IHRyZWVFbGVtZW50TG9va3VwW2NvZGViYXNlSWRUb01vdmVdLFxuICAgICAgICBuZXdDb250YWluZXJFbGVtZW50OiB0cmVlRWxlbWVudExvb2t1cFtjb2RlYmFzZUlkVG9Nb3ZlVG9dLFxuICAgICAgICBhZnRlckVsZW1lbnQ6IHRyZWVFbGVtZW50TG9va3VwW2FmdGVyQ29kZWJhc2VJZCB8fCAnJ10sXG4gICAgICAgIGJlZm9yZUVsZW1lbnQ6IHRyZWVFbGVtZW50TG9va3VwW2JlZm9yZUNvZGViYXNlSWQgfHwgJyddLFxuXG4gICAgICAgIGV4cGVjdGVkQ3VycmVudFBhcmVudDpcbiAgICAgICAgICB0cmVlRWxlbWVudExvb2t1cFtleHBlY3RlZEN1cnJlbnRQYXJlbnRDb2RlYmFzZUlkIHx8ICcnXSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHB1YmxpYyBhcHBseUNvZGViYXNlSWRDaGFuZ2VzKHByZXZJZFRvTmV3SWRNYXA6IHtcbiAgICBbcHJldklkOiBzdHJpbmddOiBzdHJpbmc7XG4gIH0pIHtcbiAgICBjb25zdCBmaWVsZHNUb0FwcGx5ID0gW1xuICAgICAgJ2NvZGViYXNlSWRUb01vdmVUbycsXG4gICAgICAnY29kZWJhc2VJZFRvTW92ZScsXG4gICAgICAnYWZ0ZXJDb2RlYmFzZUlkJyxcbiAgICAgICdiZWZvcmVDb2RlYmFzZUlkJyxcbiAgICAgICdleHBlY3RlZEN1cnJlbnRQYXJlbnRDb2RlYmFzZUlkJyxcbiAgICBdO1xuXG4gICAgZmllbGRzVG9BcHBseS5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgbmV3Q29kZWJhc2VJZCA9IHByZXZJZFRvTmV3SWRNYXBbdGhpcy5jaGFuZ2VGaWVsZHNbZmllbGRdXTtcblxuICAgICAgaWYgKG5ld0NvZGViYXNlSWQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmNoYW5nZUZpZWxkc1tmaWVsZF0gPSBuZXdDb2RlYmFzZUlkO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIFJlbW92ZSBKU1ggQ2hhbmdlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlbW92ZUpzeENoYW5nZUZpZWxkcyB7XG4gIGNvZGViYXNlSWRzVG9SZW1vdmU6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY2xhc3MgUmVtb3ZlSnN4Q2hhbmdlIGV4dGVuZHMgQ2hhbmdlTGVkZ2VySXRlbTxSZW1vdmVKc3hDaGFuZ2VGaWVsZHM+IHtcbiAgY29uc3RydWN0b3IoY2hhbmdlRmllbGRzOiBSZW1vdmVKc3hDaGFuZ2VGaWVsZHMsIGlkPzogc3RyaW5nKSB7XG4gICAgLy8gRGVkdXBsaWNhdGUgdGhlIGNvZGViYXNlSWRzVG9SZW1vdmVcbiAgICBjaGFuZ2VGaWVsZHMuY29kZWJhc2VJZHNUb1JlbW92ZSA9IEFycmF5LmZyb20oXG4gICAgICBuZXcgU2V0KGNoYW5nZUZpZWxkcy5jb2RlYmFzZUlkc1RvUmVtb3ZlKSxcbiAgICApO1xuICAgIHN1cGVyKENoYW5nZVR5cGUuUkVNT1ZFX0pTWCwgJ0RlbGV0ZSBFbGVtZW50JywgY2hhbmdlRmllbGRzLCBpZCk7XG4gIH1cblxuICBwdWJsaWMgcHJlcGFyZUFwaVJlcXVlc3QoXG4gICAgY2FudmFzSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gICAgYWN0aXZlQ2FudmFzOiBhbnksXG4gICkge1xuICAgIGNvbnN0IHsgY29kZWJhc2VJZHNUb1JlbW92ZSB9ID0gdGhpcy5jaGFuZ2VGaWVsZHM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsUGF0aDogYGNhbnZhc2VzLyR7Y2FudmFzSWR9L3BhcnNlQW5kTXV0YXRlL211dGF0ZS9yZW1vdmVKc3hFbGVtZW50YCxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZWxlbWVudHNUb1JlbW92ZTogY29kZWJhc2VJZHNUb1JlbW92ZVxuICAgICAgICAgIC5tYXAoKGNvZGViYXNlSWQ6IHN0cmluZykgPT4gdHJlZUVsZW1lbnRMb29rdXBbY29kZWJhc2VJZF0pXG4gICAgICAgICAgLmZpbHRlcigoZWxlbWVudDogYW55KSA9PiBlbGVtZW50KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHB1YmxpYyBhcHBseUNvZGViYXNlSWRDaGFuZ2VzKHByZXZJZFRvTmV3SWRNYXA6IHtcbiAgICBbcHJldklkOiBzdHJpbmddOiBzdHJpbmc7XG4gIH0pIHtcbiAgICB0aGlzLmNoYW5nZUZpZWxkcy5jb2RlYmFzZUlkc1RvUmVtb3ZlID1cbiAgICAgIHRoaXMuY2hhbmdlRmllbGRzLmNvZGViYXNlSWRzVG9SZW1vdmUubWFwKChjb2RlYmFzZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgbmV3Q29kZWJhc2VJZCA9IHByZXZJZFRvTmV3SWRNYXBbY29kZWJhc2VJZF07XG5cbiAgICAgICAgaWYgKG5ld0NvZGViYXNlSWQpIHtcbiAgICAgICAgICByZXR1cm4gbmV3Q29kZWJhc2VJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb2RlYmFzZUlkO1xuICAgICAgfSk7XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogQ2hhbmdlIFByb3AgQ2hhbmdlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5leHBvcnQgaW50ZXJmYWNlIENoYW5nZVByb3BDaGFuZ2VGaWVsZHMge1xuICBjb2RlYmFzZUlkVG9DaGFuZ2U6IHN0cmluZztcbiAgcHJvcE5hbWU6IHN0cmluZztcbiAgcHJvcFZhbHVlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBDaGFuZ2VQcm9wQ2hhbmdlIGV4dGVuZHMgQ2hhbmdlTGVkZ2VySXRlbTxDaGFuZ2VQcm9wQ2hhbmdlRmllbGRzPiB7XG4gIGNvbnN0cnVjdG9yKGNoYW5nZUZpZWxkczogQ2hhbmdlUHJvcENoYW5nZUZpZWxkcywgaWQ/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihDaGFuZ2VUeXBlLkNIQU5HRV9QUk9QLCAnQ2hhbmdlIFByb3AnLCBjaGFuZ2VGaWVsZHMsIGlkKTtcbiAgfVxuXG4gIHB1YmxpYyBwcmVwYXJlQXBpUmVxdWVzdChcbiAgICBjYW52YXNJZDogc3RyaW5nLFxuICAgIHRyZWVFbGVtZW50TG9va3VwOiB7IFtjb2RlYmFzZUlkOiBzdHJpbmddOiBhbnkgfSxcbiAgICBhY3RpdmVDYW52YXM6IGFueSxcbiAgKSB7XG4gICAgY29uc3QgeyBjb2RlYmFzZUlkVG9DaGFuZ2UsIHByb3BOYW1lLCBwcm9wVmFsdWUgfSA9IHRoaXMuY2hhbmdlRmllbGRzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybFBhdGg6IGBjYW52YXNlcy8ke2NhbnZhc0lkfS9wYXJzZUFuZE11dGF0ZS9tdXRhdGUvY2hhbmdlUHJvcFZhbHVlYCxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZWxlbWVudFRvTW9kaWZ5OiB0cmVlRWxlbWVudExvb2t1cFtjb2RlYmFzZUlkVG9DaGFuZ2VdLFxuICAgICAgICBwcm9wTmFtZSxcbiAgICAgICAgcHJvcFZhbHVlLFxuICAgICAgfSxcbiAgICAgIHN1Y2Nlc3NUb2FzdE1lc3NhZ2U6ICdQcm9wIGNoYW5nZWQnLFxuICAgIH07XG4gIH1cblxuICBwdWJsaWMgYXBwbHlDb2RlYmFzZUlkQ2hhbmdlcyhwcmV2SWRUb05ld0lkTWFwOiB7XG4gICAgW3ByZXZJZDogc3RyaW5nXTogc3RyaW5nO1xuICB9KSB7XG4gICAgY29uc3QgbmV3Q29kZWJhc2VJZCA9XG4gICAgICBwcmV2SWRUb05ld0lkTWFwW3RoaXMuY2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb0NoYW5nZV07XG5cbiAgICBpZiAobmV3Q29kZWJhc2VJZCkge1xuICAgICAgdGhpcy5jaGFuZ2VGaWVsZHMuY29kZWJhc2VJZFRvQ2hhbmdlID0gbmV3Q29kZWJhc2VJZDtcbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogV3JhcCBpbiBkaXYgY2hhbmdlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFdyYXBEaXZDaGFuZ2VGaWVsZHMge1xuICBjb2RlYmFzZUlkc1RvV3JhcDogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBXcmFwRGl2Q2hhbmdlIGV4dGVuZHMgQ2hhbmdlTGVkZ2VySXRlbTxXcmFwRGl2Q2hhbmdlRmllbGRzPiB7XG4gIGNvbnN0cnVjdG9yKGNoYW5nZUZpZWxkczogV3JhcERpdkNoYW5nZUZpZWxkcywgaWQ/OiBzdHJpbmcpIHtcbiAgICAvLyBEZWR1cGxpY2F0ZSB0aGUgY29kZWJhc2VJZHNUb1dyYXBcbiAgICBjaGFuZ2VGaWVsZHMuY29kZWJhc2VJZHNUb1dyYXAgPSBBcnJheS5mcm9tKFxuICAgICAgbmV3IFNldChjaGFuZ2VGaWVsZHMuY29kZWJhc2VJZHNUb1dyYXApLFxuICAgICk7XG4gICAgc3VwZXIoQ2hhbmdlVHlwZS5XUkFQX0RJViwgJ1dyYXAgSW4gRGl2JywgY2hhbmdlRmllbGRzLCBpZCk7XG4gIH1cblxuICBwdWJsaWMgcHJlcGFyZUFwaVJlcXVlc3QoXG4gICAgY2FudmFzSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gICAgYWN0aXZlQ2FudmFzOiBhbnksXG4gICkge1xuICAgIGNvbnN0IHsgY29kZWJhc2VJZHNUb1dyYXAgfSA9IHRoaXMuY2hhbmdlRmllbGRzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybFBhdGg6IGBjYW52YXNlcy8ke2NhbnZhc0lkfS9wYXJzZUFuZE11dGF0ZS9tdXRhdGUvd3JhcEluRGl2YCxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgcmVhY3RFbGVtZW50czogY29kZWJhc2VJZHNUb1dyYXAubWFwKFxuICAgICAgICAgIChjb2RlYmFzZUlkOiBzdHJpbmcpID0+IHRyZWVFbGVtZW50TG9va3VwW2NvZGViYXNlSWRdLFxuICAgICAgICApLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIGFwcGx5Q29kZWJhc2VJZENoYW5nZXMocHJldklkVG9OZXdJZE1hcDoge1xuICAgIFtwcmV2SWQ6IHN0cmluZ106IHN0cmluZztcbiAgfSkge1xuICAgIHRoaXMuY2hhbmdlRmllbGRzLmNvZGViYXNlSWRzVG9XcmFwID1cbiAgICAgIHRoaXMuY2hhbmdlRmllbGRzLmNvZGViYXNlSWRzVG9XcmFwLm1hcCgoY29kZWJhc2VJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld0NvZGViYXNlSWQgPSBwcmV2SWRUb05ld0lkTWFwW2NvZGViYXNlSWRdO1xuXG4gICAgICAgIGlmIChuZXdDb2RlYmFzZUlkKSB7XG4gICAgICAgICAgcmV0dXJuIG5ld0NvZGViYXNlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29kZWJhc2VJZDtcbiAgICAgIH0pO1xuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIER1cGxpY2F0ZSBjaGFuZ2VcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmV4cG9ydCBpbnRlcmZhY2UgRHVwbGljYXRlQ2hhbmdlRmllbGRzIHtcbiAgY29kZWJhc2VJZHNUb0R1cGxpY2F0ZTogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBEdXBsaWNhdGVDaGFuZ2UgZXh0ZW5kcyBDaGFuZ2VMZWRnZXJJdGVtPER1cGxpY2F0ZUNoYW5nZUZpZWxkcz4ge1xuICBjb25zdHJ1Y3RvcihjaGFuZ2VGaWVsZHM6IER1cGxpY2F0ZUNoYW5nZUZpZWxkcywgaWQ/OiBzdHJpbmcpIHtcbiAgICAvLyBEZWR1cGxpY2F0ZSB0aGUgY29kZWJhc2VJZHNUb0R1cGxpY2F0ZVxuICAgIGNoYW5nZUZpZWxkcy5jb2RlYmFzZUlkc1RvRHVwbGljYXRlID0gQXJyYXkuZnJvbShcbiAgICAgIG5ldyBTZXQoY2hhbmdlRmllbGRzLmNvZGViYXNlSWRzVG9EdXBsaWNhdGUpLFxuICAgICk7XG4gICAgc3VwZXIoQ2hhbmdlVHlwZS5EVVBMSUNBVEUsICdEdXBsaWNhdGUnLCBjaGFuZ2VGaWVsZHMsIGlkKTtcbiAgfVxuXG4gIHB1YmxpYyBwcmVwYXJlQXBpUmVxdWVzdChcbiAgICBjYW52YXNJZDogc3RyaW5nLFxuICAgIHRyZWVFbGVtZW50TG9va3VwOiB7IFtjb2RlYmFzZUlkOiBzdHJpbmddOiBhbnkgfSxcbiAgICBhY3RpdmVDYW52YXM6IGFueSxcbiAgKSB7XG4gICAgY29uc3QgeyBjb2RlYmFzZUlkc1RvRHVwbGljYXRlIH0gPSB0aGlzLmNoYW5nZUZpZWxkcztcblxuICAgIHJldHVybiB7XG4gICAgICB1cmxQYXRoOiBgY2FudmFzZXMvJHtjYW52YXNJZH0vcGFyc2VBbmRNdXRhdGUvbXV0YXRlL2R1cGxpY2F0ZWAsXG4gICAgICBib2R5OiB7XG4gICAgICAgIHJlYWN0RWxlbWVudHM6IGNvZGViYXNlSWRzVG9EdXBsaWNhdGUubWFwKFxuICAgICAgICAgIChjb2RlYmFzZUlkOiBzdHJpbmcpID0+IHRyZWVFbGVtZW50TG9va3VwW2NvZGViYXNlSWRdLFxuICAgICAgICApLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIGFwcGx5Q29kZWJhc2VJZENoYW5nZXMocHJldklkVG9OZXdJZE1hcDoge1xuICAgIFtwcmV2SWQ6IHN0cmluZ106IHN0cmluZztcbiAgfSkge1xuICAgIHRoaXMuY2hhbmdlRmllbGRzLmNvZGViYXNlSWRzVG9EdXBsaWNhdGUgPVxuICAgICAgdGhpcy5jaGFuZ2VGaWVsZHMuY29kZWJhc2VJZHNUb0R1cGxpY2F0ZS5tYXAoKGNvZGViYXNlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBuZXdDb2RlYmFzZUlkID0gcHJldklkVG9OZXdJZE1hcFtjb2RlYmFzZUlkXTtcblxuICAgICAgICBpZiAobmV3Q29kZWJhc2VJZCkge1xuICAgICAgICAgIHJldHVybiBuZXdDb2RlYmFzZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvZGViYXNlSWQ7XG4gICAgICB9KTtcbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBDaGFuZ2UgVGFnIENoYW5nZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuZXhwb3J0IGludGVyZmFjZSBDaGFuZ2VUYWdDaGFuZ2VGaWVsZHMge1xuICBjb2RlYmFzZUlkVG9DaGFuZ2U6IHN0cmluZztcbiAgbmV3VGFnTmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ2hhbmdlVGFnQ2hhbmdlIGV4dGVuZHMgQ2hhbmdlTGVkZ2VySXRlbTxDaGFuZ2VUYWdDaGFuZ2VGaWVsZHM+IHtcbiAgY29uc3RydWN0b3IoY2hhbmdlRmllbGRzOiBDaGFuZ2VUYWdDaGFuZ2VGaWVsZHMsIGlkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoQ2hhbmdlVHlwZS5DSEFOR0VfVEFHLCAnQ2hhbmdlIFRhZyBOYW1lJywgY2hhbmdlRmllbGRzLCBpZCk7XG4gIH1cblxuICBwdWJsaWMgcHJlcGFyZUFwaVJlcXVlc3QoXG4gICAgY2FudmFzSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gICAgYWN0aXZlQ2FudmFzOiBhbnksXG4gICkge1xuICAgIGNvbnN0IHsgY29kZWJhc2VJZFRvQ2hhbmdlLCBuZXdUYWdOYW1lIH0gPSB0aGlzLmNoYW5nZUZpZWxkcztcblxuICAgIHJldHVybiB7XG4gICAgICB1cmxQYXRoOiBgY2FudmFzZXMvJHtjYW52YXNJZH0vcGFyc2VBbmRNdXRhdGUvbXV0YXRlL2NoYW5nZUVsZW1lbnRUYWdgLFxuICAgICAgYm9keToge1xuICAgICAgICBlbGVtZW50VG9Nb2RpZnk6IHRyZWVFbGVtZW50TG9va3VwW2NvZGViYXNlSWRUb0NoYW5nZV0sXG4gICAgICAgIG5ld1RhZzogbmV3VGFnTmFtZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHB1YmxpYyBhcHBseUNvZGViYXNlSWRDaGFuZ2VzKHByZXZJZFRvTmV3SWRNYXA6IHtcbiAgICBbcHJldklkOiBzdHJpbmddOiBzdHJpbmc7XG4gIH0pIHtcbiAgICBjb25zdCBuZXdDb2RlYmFzZUlkID1cbiAgICAgIHByZXZJZFRvTmV3SWRNYXBbdGhpcy5jaGFuZ2VGaWVsZHMuY29kZWJhc2VJZFRvQ2hhbmdlXTtcblxuICAgIGlmIChuZXdDb2RlYmFzZUlkKSB7XG4gICAgICB0aGlzLmNoYW5nZUZpZWxkcy5jb2RlYmFzZUlkVG9DaGFuZ2UgPSBuZXdDb2RlYmFzZUlkO1xuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBBZGQgY2xhc3MgQ2hhbmdlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5leHBvcnQgaW50ZXJmYWNlIEFkZENsYXNzQ2hhbmdlRmllbGRzIHtcbiAgY29kZWJhc2VJZFRvQWRkQ2xhc3M6IHN0cmluZztcbiAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gIG1vZGlmaWVyczogc3RyaW5nW107XG4gIGN1c3RvbVByb3BlcnRpZXM6IENsYXNzVHlwZVtdO1xuICBhZGRpbmdUYWlsd2luZENsYXNzPzogYm9vbGVhbjtcblxuICAvLyBVc2VkIGluIGluc3RhbnQgdXBkYXRlZFxuICBjc3NFcXVpdmFsZW50Pzogc3RyaW5nO1xuXG4gIC8vIE5vdCBpbiB0aGUgY2hhbmdlIGxlZGdlciwgb25seSB1c2VkIGZvciBkcmFnZ2luZyBpbnN0YW50IHVwZGF0ZXNcbiAgdGVtcG9yYXJ5T25seT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBBZGRDbGFzc0NoYW5nZSBleHRlbmRzIENoYW5nZUxlZGdlckl0ZW08QWRkQ2xhc3NDaGFuZ2VGaWVsZHM+IHtcbiAgY29uc3RydWN0b3IoY2hhbmdlRmllbGRzOiBBZGRDbGFzc0NoYW5nZUZpZWxkcywgaWQ/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihDaGFuZ2VUeXBlLkFERF9DTEFTUywgJ0FkZCBDbGFzcycsIGNoYW5nZUZpZWxkcywgaWQpO1xuXG4gICAgdGhpcy5jYW5JbnN0YW50VXBkYXRlV2hpbGVGbHVzaGluZyA9IHRydWU7XG4gIH1cblxuICBwdWJsaWMgcHJlcGFyZUFwaVJlcXVlc3QoXG4gICAgY2FudmFzSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gICAgYWN0aXZlQ2FudmFzOiBhbnksXG4gICkge1xuICAgIGNvbnN0IHtcbiAgICAgIGNvZGViYXNlSWRUb0FkZENsYXNzLFxuICAgICAgY2xhc3NOYW1lLFxuICAgICAgYWRkaW5nVGFpbHdpbmRDbGFzcyxcbiAgICAgIG1vZGlmaWVycyxcbiAgICAgIGN1c3RvbVByb3BlcnRpZXMsXG4gICAgfSA9IHRoaXMuY2hhbmdlRmllbGRzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybFBhdGg6IGBjYW52YXNlcy8ke2NhbnZhc0lkfS9wYXJzZUFuZE11dGF0ZS9tdXRhdGUvYWRkQ2xhc3NgLFxuICAgICAgYm9keToge1xuICAgICAgICByZWFjdEVsZW1lbnQ6IHRyZWVFbGVtZW50TG9va3VwW2NvZGViYXNlSWRUb0FkZENsYXNzXSxcbiAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICBzdHlsaW5nRnJhbWV3b3JrOiBhZGRpbmdUYWlsd2luZENsYXNzXG4gICAgICAgICAgPyBTdHlsaW5nRnJhbWV3b3JrLlRBSUxXSU5EXG4gICAgICAgICAgOiBudWxsLFxuICAgICAgICBtb2RpZmllcnMsXG4gICAgICAgIGN1c3RvbVByb3BlcnRpZXMsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwdWJsaWMgYXBwbHlDb2RlYmFzZUlkQ2hhbmdlcyhwcmV2SWRUb05ld0lkTWFwOiB7XG4gICAgW3ByZXZJZDogc3RyaW5nXTogc3RyaW5nO1xuICB9KSB7XG4gICAgY29uc3QgbmV3Q29kZWJhc2VJZCA9XG4gICAgICBwcmV2SWRUb05ld0lkTWFwW3RoaXMuY2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb0FkZENsYXNzXTtcblxuICAgIGlmIChuZXdDb2RlYmFzZUlkKSB7XG4gICAgICB0aGlzLmNoYW5nZUZpZWxkcy5jb2RlYmFzZUlkVG9BZGRDbGFzcyA9IG5ld0NvZGViYXNlSWQ7XG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIFJlbW92ZSBjbGFzcyBjaGFuZ2VcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVtb3ZlQ2xhc3NDaGFuZ2VGaWVsZHMge1xuICBjb2RlYmFzZUlkVG9SZW1vdmVDbGFzczogc3RyaW5nO1xuICBjbGFzc05hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFJlbW92ZUNsYXNzQ2hhbmdlIGV4dGVuZHMgQ2hhbmdlTGVkZ2VySXRlbTxSZW1vdmVDbGFzc0NoYW5nZUZpZWxkcz4ge1xuICBjb25zdHJ1Y3RvcihjaGFuZ2VGaWVsZHM6IFJlbW92ZUNsYXNzQ2hhbmdlRmllbGRzLCBpZD86IHN0cmluZykge1xuICAgIHN1cGVyKENoYW5nZVR5cGUuUkVNT1ZFX0NMQVNTLCAnUmVtb3ZlIENsYXNzJywgY2hhbmdlRmllbGRzLCBpZCk7XG4gIH1cblxuICBwdWJsaWMgcHJlcGFyZUFwaVJlcXVlc3QoXG4gICAgY2FudmFzSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gICAgYWN0aXZlQ2FudmFzOiBhbnksXG4gICkge1xuICAgIGNvbnN0IHsgY29kZWJhc2VJZFRvUmVtb3ZlQ2xhc3MsIGNsYXNzTmFtZSB9ID0gdGhpcy5jaGFuZ2VGaWVsZHM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsUGF0aDogYGNhbnZhc2VzLyR7Y2FudmFzSWR9L3BhcnNlQW5kTXV0YXRlL211dGF0ZS9yZW1vdmVDbGFzc2AsXG4gICAgICBib2R5OiB7XG4gICAgICAgIHJlYWN0RWxlbWVudDogdHJlZUVsZW1lbnRMb29rdXBbY29kZWJhc2VJZFRvUmVtb3ZlQ2xhc3NdLFxuICAgICAgICBjbGFzc05hbWUsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwdWJsaWMgYXBwbHlDb2RlYmFzZUlkQ2hhbmdlcyhwcmV2SWRUb05ld0lkTWFwOiB7XG4gICAgW3ByZXZJZDogc3RyaW5nXTogc3RyaW5nO1xuICB9KSB7XG4gICAgY29uc3QgbmV3Q29kZWJhc2VJZCA9XG4gICAgICBwcmV2SWRUb05ld0lkTWFwW3RoaXMuY2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb1JlbW92ZUNsYXNzXTtcblxuICAgIGlmIChuZXdDb2RlYmFzZUlkKSB7XG4gICAgICB0aGlzLmNoYW5nZUZpZWxkcy5jb2RlYmFzZUlkVG9SZW1vdmVDbGFzcyA9IG5ld0NvZGViYXNlSWQ7XG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIEVkaXQgdGV4dCBjaGFuZ2VcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5leHBvcnQgaW50ZXJmYWNlIEVkaXRUZXh0Q2hhbmdlRmllbGRzIHtcbiAgY29kZWJhc2VJZFRvRWRpdFRleHQ6IHN0cmluZztcbiAgbmV3VGV4dDogc3RyaW5nO1xuICBvbGRUZXh0Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgRWRpdFRleHRDaGFuZ2UgZXh0ZW5kcyBDaGFuZ2VMZWRnZXJJdGVtPEVkaXRUZXh0Q2hhbmdlRmllbGRzPiB7XG4gIGNvbnN0cnVjdG9yKGNoYW5nZUZpZWxkczogRWRpdFRleHRDaGFuZ2VGaWVsZHMsIGlkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoQ2hhbmdlVHlwZS5FRElUX1RFWFQsICdFZGl0IFRleHQnLCBjaGFuZ2VGaWVsZHMsIGlkKTtcbiAgfVxuXG4gIHB1YmxpYyBwcmVwYXJlQXBpUmVxdWVzdChcbiAgICBjYW52YXNJZDogc3RyaW5nLFxuICAgIHRyZWVFbGVtZW50TG9va3VwOiB7IFtjb2RlYmFzZUlkOiBzdHJpbmddOiBhbnkgfSxcbiAgICBhY3RpdmVDYW52YXM6IGFueSxcbiAgKSB7XG4gICAgY29uc3QgeyBjb2RlYmFzZUlkVG9FZGl0VGV4dCwgbmV3VGV4dCwgb2xkVGV4dCB9ID0gdGhpcy5jaGFuZ2VGaWVsZHM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsUGF0aDogYGNhbnZhc2VzLyR7Y2FudmFzSWR9L3BhcnNlQW5kTXV0YXRlL211dGF0ZS9lZGl0VGV4dGAsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGVsZW1lbnQ6IHRyZWVFbGVtZW50TG9va3VwW2NvZGViYXNlSWRUb0VkaXRUZXh0XSxcbiAgICAgICAgbmV3VGV4dCxcbiAgICAgICAgb2xkVGV4dCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHB1YmxpYyBhcHBseUNvZGViYXNlSWRDaGFuZ2VzKHByZXZJZFRvTmV3SWRNYXA6IHtcbiAgICBbcHJldklkOiBzdHJpbmddOiBzdHJpbmc7XG4gIH0pIHtcbiAgICBjb25zdCBuZXdDb2RlYmFzZUlkID1cbiAgICAgIHByZXZJZFRvTmV3SWRNYXBbdGhpcy5jaGFuZ2VGaWVsZHMuY29kZWJhc2VJZFRvRWRpdFRleHRdO1xuXG4gICAgaWYgKG5ld0NvZGViYXNlSWQpIHtcbiAgICAgIHRoaXMuY2hhbmdlRmllbGRzLmNvZGViYXNlSWRUb0VkaXRUZXh0ID0gbmV3Q29kZWJhc2VJZDtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgQW55Q2hhbmdlTGVkZ2VySXRlbSA9IENoYW5nZUxlZGdlckl0ZW08YW55PjtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogVW5kbyBDaGFuZ2UgVHlwZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmV4cG9ydCBpbnRlcmZhY2UgVW5kb0NoYW5nZUZpZWxkcyB7XG4gIGNoYW5nZVRvVW5kbzogQW55Q2hhbmdlTGVkZ2VySXRlbTtcbiAgbWF0Y2hpbmdBY3Rpdml0eUZsdXNoZWQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgVW5kb0NoYW5nZSBleHRlbmRzIENoYW5nZUxlZGdlckl0ZW08VW5kb0NoYW5nZUZpZWxkcz4ge1xuICBjb25zdHJ1Y3RvcihjaGFuZ2VGaWVsZHM6IFVuZG9DaGFuZ2VGaWVsZHMsIGlkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoQ2hhbmdlVHlwZS5VTkRPLCAnVW5kbycsIGNoYW5nZUZpZWxkcywgaWQpO1xuXG4gICAgaWYgKGNoYW5nZUZpZWxkcy5jaGFuZ2VUb1VuZG8/LmNhbkluc3RhbnRVcGRhdGVXaGlsZUZsdXNoaW5nKSB7XG4gICAgICB0aGlzLmNhbkluc3RhbnRVcGRhdGVXaGlsZUZsdXNoaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgcHJlcGFyZUFwaVJlcXVlc3QoXG4gICAgY2FudmFzSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gICAgYWN0aXZlQ2FudmFzOiBhbnksXG4gICkge1xuICAgIGNvbnN0IHsgY2hhbmdlVG9VbmRvIH0gPSB0aGlzLmNoYW5nZUZpZWxkcztcblxuICAgIHJldHVybiB7XG4gICAgICB1cmxQYXRoOiBgY2FudmFzZXMvJHtjYW52YXNJZH0vcGFyc2VBbmRNdXRhdGUvYWN0aXZpdGllcy91bmRvQ2hhbmdlVG9GaWxlc2AsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGxhdGVzdFV1aWQ6IGNoYW5nZVRvVW5kby5hY3Rpdml0eUlkLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIGFwcGx5Q29kZWJhc2VJZENoYW5nZXMocHJldklkVG9OZXdJZE1hcDoge1xuICAgIFtwcmV2SWQ6IHN0cmluZ106IHN0cmluZztcbiAgfSkge1xuICAgIC8vIERvIG5vdGhpbmdcbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBSZWRvIENoYW5nZSBUeXBlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuZXhwb3J0IGludGVyZmFjZSBSZWRvQ2hhbmdlRmllbGRzIHtcbiAgY2hhbmdlVG9SZWRvOiBBbnlDaGFuZ2VMZWRnZXJJdGVtO1xufVxuXG5leHBvcnQgY2xhc3MgUmVkb0NoYW5nZSBleHRlbmRzIENoYW5nZUxlZGdlckl0ZW08UmVkb0NoYW5nZUZpZWxkcz4ge1xuICBjb25zdHJ1Y3RvcihjaGFuZ2VGaWVsZHM6IFJlZG9DaGFuZ2VGaWVsZHMsIGlkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoQ2hhbmdlVHlwZS5SRURPLCAnUmVkbycsIGNoYW5nZUZpZWxkcywgaWQpO1xuXG4gICAgaWYgKGNoYW5nZUZpZWxkcy5jaGFuZ2VUb1JlZG8/LmNhbkluc3RhbnRVcGRhdGVXaGlsZUZsdXNoaW5nKSB7XG4gICAgICB0aGlzLmNhbkluc3RhbnRVcGRhdGVXaGlsZUZsdXNoaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgcHJlcGFyZUFwaVJlcXVlc3QoXG4gICAgY2FudmFzSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gICAgYWN0aXZlQ2FudmFzOiBhbnksXG4gICkge1xuICAgIGNvbnN0IHsgY2hhbmdlVG9SZWRvIH0gPSB0aGlzLmNoYW5nZUZpZWxkcztcblxuICAgIHJldHVybiB7XG4gICAgICB1cmxQYXRoOiBgY2FudmFzZXMvJHtjYW52YXNJZH0vcGFyc2VBbmRNdXRhdGUvYWN0aXZpdGllcy9yZWRvQ2hhbmdlVG9GaWxlc2AsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGNoYW5nZVRvUmVkb0lkOiBjaGFuZ2VUb1JlZG8uYWN0aXZpdHlJZCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHB1YmxpYyBhcHBseUNvZGViYXNlSWRDaGFuZ2VzKHByZXZJZFRvTmV3SWRNYXA6IHtcbiAgICBbcHJldklkOiBzdHJpbmddOiBzdHJpbmc7XG4gIH0pIHtcbiAgICAvLyBEbyBub3RoaW5nXG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogVW5rbm93biBDaGFuZ2UgVHlwZVxuICpcbiAqIFRoaXMgY2hhbmdlIHR5cGUgaXMgY3JlYXRlZCBmcm9tIHRoZSBhY3Rpdml0eSBzdHJlYW0gd2hlbiB0aGUgY2hhbmdlXG4gKiBsZWRnZXIgZ29lcyBvdXQgb2Ygc3luYyB3aXRoIGl0LiBUaGlzIGFsbG93cyB0aGUgdXNlciB0byBzdGlsbCB1bmRvXG4gKiB0aGF0IGNoYW5nZS5cbiAqXG4gKiBUaGlzIGNhbiBoYXBwZW4gaWYgZm9yIGV4YW1wbGUgYSBjYW52YXMgaXMgYmVpbmcgc2hhcmVkIGFuZCBhbm90aGVyXG4gKiB1c2VyIG1ha2VzIGEgY2hhbmdlIGluIGJldHdlZW4gdGhpcyB1c2VycycgY2hhbmdlc1xuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmV4cG9ydCBpbnRlcmZhY2UgVW5rbm93bkNoYW5nZUZpZWxkcyB7fVxuXG5leHBvcnQgY2xhc3MgVW5rbm93bkNoYW5nZSBleHRlbmRzIENoYW5nZUxlZGdlckl0ZW08VW5rbm93bkNoYW5nZUZpZWxkcz4ge1xuICBjb25zdHJ1Y3RvcihjaGFuZ2VGaWVsZHM6IFVua25vd25DaGFuZ2VGaWVsZHMsIGlkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoQ2hhbmdlVHlwZS5VTktOT1dOLCAnJywgY2hhbmdlRmllbGRzLCBpZCk7XG4gICAgLy8gRG8gbm90IHByb2Nlc3MgdW5rbm93biBjaGFuZ2VzXG4gICAgdGhpcy5tYXJrUHJvY2Vzc2VkU3VjY2VlZGVkKCk7XG4gICAgdGhpcy5kb05vdFNlbmRJbnN0YW50VXBkYXRlKCk7XG4gIH1cblxuICBwdWJsaWMgcHJlcGFyZUFwaVJlcXVlc3QoXG4gICAgY2FudmFzSWQ6IHN0cmluZyxcbiAgICB0cmVlRWxlbWVudExvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gICAgYWN0aXZlQ2FudmFzOiBhbnksXG4gICkge1xuICAgIHRocm93IEVycm9yKCdVbnN1cHBvcnRlZCBvcGVyYXRpb24nKTtcblxuICAgIC8vIEZvciB0eXBpbmdcbiAgICByZXR1cm4ge1xuICAgICAgdXJsUGF0aDogYGAsXG4gICAgICBib2R5OiB7fSxcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIGFwcGx5Q29kZWJhc2VJZENoYW5nZXMocHJldklkVG9OZXdJZE1hcDoge1xuICAgIFtwcmV2SWQ6IHN0cmluZ106IHN0cmluZztcbiAgfSkge1xuICAgIC8vIERvIG5vdGhpbmdcbiAgfVxufVxuXG4vKipcbiAqIFdoZW4gc2VyaWFsaXppbmcgYSBjaGFuZ2UgbGVkZ2VyIGl0ZW0gdG8gYSBwbGFpbiBKUyBvYmplY3QsIHRoZSBjbGFzcyBmdW5jdGlvbnNcbiAqIGFyZSBsb3N0LiBUaGlzIHJlY3JlYXRlcyB0aGUgY2hhbmdlIGl0ZW0gdGhhdCB3YXMgbG9zdFxuICovXG5leHBvcnQgY29uc3QgcmVjb25zdHJ1Y3RDaGFuZ2VMZWRnZXJDbGFzcyA9IChwbGFpbkpzT2JqZWN0OiB7XG4gIFtrZXk6IHN0cmluZ106IGFueTtcbn0pOiBBbnlDaGFuZ2VMZWRnZXJJdGVtIHwgbnVsbCA9PiB7XG4gIGlmICghcGxhaW5Kc09iamVjdCB8fCAhcGxhaW5Kc09iamVjdC50eXBlKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBjaGFuZ2VUeXBlID0gcGxhaW5Kc09iamVjdC50eXBlIGFzIENoYW5nZVR5cGU7XG4gIGNvbnN0IGNoYW5nZUZpZWxkcyA9IHBsYWluSnNPYmplY3QuY2hhbmdlRmllbGRzO1xuICBjb25zdCBpZCA9IHBsYWluSnNPYmplY3QuaWQ7XG5cbiAgY29uc3QgZ2V0Q2hhbmdlRm9yVHlwZSA9ICgpID0+IHtcbiAgICBzd2l0Y2ggKGNoYW5nZVR5cGUpIHtcbiAgICAgIGNhc2UgQ2hhbmdlVHlwZS5TVFlMSU5HOlxuICAgICAgICByZXR1cm4gbmV3IFN0eWxpbmdDaGFuZ2UoY2hhbmdlRmllbGRzLCBpZCk7XG4gICAgICBjYXNlIENoYW5nZVR5cGUuQUREX0pTWDpcbiAgICAgICAgcmV0dXJuIG5ldyBBZGRKc3hDaGFuZ2UoY2hhbmdlRmllbGRzLCBpZCk7XG4gICAgICBjYXNlIENoYW5nZVR5cGUuUkVNT1ZFX0pTWDpcbiAgICAgICAgcmV0dXJuIG5ldyBSZW1vdmVKc3hDaGFuZ2UoY2hhbmdlRmllbGRzLCBpZCk7XG4gICAgICBjYXNlIENoYW5nZVR5cGUuTU9WRV9KU1g6XG4gICAgICAgIHJldHVybiBuZXcgTW92ZUpzeENoYW5nZShjaGFuZ2VGaWVsZHMsIGlkKTtcbiAgICAgIGNhc2UgQ2hhbmdlVHlwZS5DSEFOR0VfUFJPUDpcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VQcm9wQ2hhbmdlKGNoYW5nZUZpZWxkcywgaWQpO1xuICAgICAgY2FzZSBDaGFuZ2VUeXBlLkFERF9DTEFTUzpcbiAgICAgICAgcmV0dXJuIG5ldyBBZGRDbGFzc0NoYW5nZShjaGFuZ2VGaWVsZHMsIGlkKTtcbiAgICAgIGNhc2UgQ2hhbmdlVHlwZS5SRU1PVkVfQ0xBU1M6XG4gICAgICAgIHJldHVybiBuZXcgUmVtb3ZlQ2xhc3NDaGFuZ2UoY2hhbmdlRmllbGRzLCBpZCk7XG4gICAgICBjYXNlIENoYW5nZVR5cGUuV1JBUF9ESVY6XG4gICAgICAgIHJldHVybiBuZXcgV3JhcERpdkNoYW5nZShjaGFuZ2VGaWVsZHMsIGlkKTtcbiAgICAgIGNhc2UgQ2hhbmdlVHlwZS5DSEFOR0VfVEFHOlxuICAgICAgICByZXR1cm4gbmV3IENoYW5nZVRhZ0NoYW5nZShjaGFuZ2VGaWVsZHMsIGlkKTtcbiAgICAgIGNhc2UgQ2hhbmdlVHlwZS5EVVBMSUNBVEU6XG4gICAgICAgIHJldHVybiBuZXcgRHVwbGljYXRlQ2hhbmdlKGNoYW5nZUZpZWxkcywgaWQpO1xuICAgICAgY2FzZSBDaGFuZ2VUeXBlLkVESVRfVEVYVDpcbiAgICAgICAgcmV0dXJuIG5ldyBFZGl0VGV4dENoYW5nZShjaGFuZ2VGaWVsZHMsIGlkKTtcbiAgICAgIGNhc2UgQ2hhbmdlVHlwZS5VTkRPOlxuICAgICAgICBjaGFuZ2VGaWVsZHMuY2hhbmdlVG9VbmRvID0gcmVjb25zdHJ1Y3RDaGFuZ2VMZWRnZXJDbGFzcyhcbiAgICAgICAgICBjaGFuZ2VGaWVsZHMuY2hhbmdlVG9VbmRvLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gbmV3IFVuZG9DaGFuZ2UoY2hhbmdlRmllbGRzLCBpZCk7XG4gICAgICBjYXNlIENoYW5nZVR5cGUuUkVETzpcbiAgICAgICAgY2hhbmdlRmllbGRzLmNoYW5nZVRvUmVkbyA9IHJlY29uc3RydWN0Q2hhbmdlTGVkZ2VyQ2xhc3MoXG4gICAgICAgICAgY2hhbmdlRmllbGRzLmNoYW5nZVRvUmVkbyxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWRvQ2hhbmdlKGNoYW5nZUZpZWxkcywgaWQpO1xuICAgICAgY2FzZSBDaGFuZ2VUeXBlLlVOS05PV046XG4gICAgICAgIHJldHVybiBuZXcgVW5rbm93bkNoYW5nZShjaGFuZ2VGaWVsZHMsIGlkKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBjaGFuZ2UgdHlwZTogJHtjaGFuZ2VUeXBlfWApO1xuICAgIH1cbiAgfTtcblxuICAvLyBTZXQgYWxsIHRoZSBvdGhlciBmaWVsZHMgb24gdGhlIGNoYW5nZSBvYmplY3RcbiAgY29uc3QgY2hhbmdlID0gZ2V0Q2hhbmdlRm9yVHlwZSgpO1xuICBPYmplY3Qua2V5cyhwbGFpbkpzT2JqZWN0KS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgIGlmIChbJ3R5cGUnLCAnY2hhbmdlRmllbGRzJywgJ2lkJ10uaW5jbHVkZXMoa2V5KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjaGFuZ2Vba2V5XSA9IHBsYWluSnNPYmplY3Rba2V5XTtcbiAgfSk7XG5cbiAgcmV0dXJuIGNoYW5nZTtcbn07XG4iXX0=