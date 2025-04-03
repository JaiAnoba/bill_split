export declare enum StylingFramework {
    INLINE = "Inline",
    CSS = "CSS",
    TAILWIND = "Tailwind"
}
type ClassType = {
    tailwind: string;
    css: string;
};
export declare enum ChangeType {
    STYLING = "STYLING",
    ADD_JSX = "ADD_JSX",
    MOVE_JSX = "MOVE_JSX",
    REMOVE_JSX = "REMOVE_JSX",
    CHANGE_PROP = "CHANGE_PROP",
    ADD_CLASS = "ADD_CLASS",
    REMOVE_CLASS = "REMOVE_CLASS",
    EDIT_TEXT = "EDIT_TEXT",
    WRAP_DIV = "WRAP_DIV",
    CHANGE_TAG = "CHANGE_TAG",
    DUPLICATE = "DUPLICATE",
    UNDO = "UNDO",
    REDO = "REDO",
    UNKNOWN = "UNKNOWN"
}
export declare const CHANGE_TYPES_WITH_INSTANT_UNDO: ChangeType[];
export declare abstract class ChangeLedgerItem<T> {
    id: string;
    type: ChangeType;
    changeName: string;
    indexInLedger?: number;
    changeFields: T;
    canInstantUpdateWhileFlushing: boolean;
    activityId?: string;
    prevIdToNewIdMap: {
        [prevId: string]: string;
    };
    changeUndone?: boolean;
    toastId?: string | number;
    private _consumed;
    private _failed;
    private _instantUpdateSent;
    private _instantUpdateFinished;
    private _instantUpdateSuccessful;
    private _sendInstantUpdate;
    private _instantUpdateData?;
    private elementKeyToSelectAfterInstantUpdate?;
    private elementKeysToMultiselectAfterInstantUpdate?;
    private elementKeyToSelectAfterUndoInstantUpdate?;
    private elementKeysToMultiselectAfterUndoInstantUpdate?;
    private _resolveApi?;
    private _rejectApi?;
    private _apiRejectionAdded?;
    private _apiPromise;
    constructor(type: ChangeType, changeName: string, changeFields: T, id?: string);
    resolveApi(data?: any): void;
    rejectApi(reason?: any): void;
    needsToSendInstantUpdate(): boolean;
    markInstantUpdateSent(): void;
    markInstantUpdateFinished(instantUpdateData: any, instantUpdateSuccessful: boolean): void;
    getInstantUpdateData(): any;
    wasInstantUpdateSuccessful(): boolean;
    isInstantUpdateFinished(): boolean;
    markProcessedSucceeded(): void;
    markProcessedFailed(): void;
    isFailed(): boolean;
    needToProcessChange(): boolean;
    onApiResolve(onFulfilled: (data?: any) => void): Promise<void>;
    onApiReject(onRejected: (reason?: any) => void): Promise<void>;
    abstract prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            [key: string]: any;
        };
        successToastMessage?: string;
    };
    doNotSendInstantUpdate(): void;
    clearSelectedElementsAfterInstantUpdate(): void;
    setSelectedElementsAfterInstantUpdate(selectedElementKey: string, multiselectedElementKeys: string[]): void;
    clearSelectedElementsAfterUndoInstantUpdate(): void;
    setSelectedElementsAfterUndoInstantUpdate(selectedElementKey: string, multiselectedElementKeys: string[]): void;
    getElementKeyToSelectAfterInstantUpdate(): string | null | undefined;
    getElementKeysToMultiselectAfterInstantUpdate(): string[] | null | undefined;
    getElementKeyToSelectAfterUndoInstantUpdate(): string | null | undefined;
    getElementKeysToMultiselectAfterUndoInstantUpdate(): string[] | null | undefined;
    abstract applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
    applyAllCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Styling Change
 ************************************************************************/
export interface StylingChangeFields {
    codebaseId: string;
    stylingChanges: {
        [cssKey: string]: string;
    };
    stylingFramework: StylingFramework.TAILWIND;
    modifiers: string[];
    customProperties: ClassType[];
}
export declare class StylingChange extends ChangeLedgerItem<StylingChangeFields> {
    constructor(changeFields: StylingChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            reactElement: any;
            styling: {
                [cssKey: string]: string;
            };
            stylingFramework: StylingFramework.TAILWIND;
            modifiers: string[];
            customProperties: ClassType[];
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Add Jsx Change
 ************************************************************************/
export interface AddJsxChangeFields {
    codebaseIdToAddTo: string;
    beforeCodebaseId?: string;
    afterCodebaseId?: string;
    addCodebaseId?: string;
    addNativeTag?: string;
    fileContentsToSourceFrom?: string;
    fileContentsSourceFilename?: string;
    propsToSet?: {
        [key: string]: any;
    };
    deletedStoryboardId?: string;
    htmlForInstantUpdate?: string;
}
export declare class AddJsxChange extends ChangeLedgerItem<AddJsxChangeFields> {
    constructor(changeFields: AddJsxChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: any;
        successToastMessage: string | undefined;
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Move JSX Change
 ************************************************************************/
export interface MoveJsxChangeFields {
    codebaseIdToMoveTo: string;
    codebaseIdToMove: string;
    afterCodebaseId?: string;
    beforeCodebaseId?: string;
    expectedCurrentParentCodebaseId?: string;
}
export declare class MoveJsxChange extends ChangeLedgerItem<MoveJsxChangeFields> {
    constructor(changeFields: MoveJsxChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            elementToMove: any;
            newContainerElement: any;
            afterElement: any;
            beforeElement: any;
            expectedCurrentParent: any;
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Remove JSX Change
 ************************************************************************/
export interface RemoveJsxChangeFields {
    codebaseIdsToRemove: string[];
}
export declare class RemoveJsxChange extends ChangeLedgerItem<RemoveJsxChangeFields> {
    constructor(changeFields: RemoveJsxChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            elementsToRemove: any[];
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Change Prop Change
 ************************************************************************/
export interface ChangePropChangeFields {
    codebaseIdToChange: string;
    propName: string;
    propValue: string;
}
export declare class ChangePropChange extends ChangeLedgerItem<ChangePropChangeFields> {
    constructor(changeFields: ChangePropChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            elementToModify: any;
            propName: string;
            propValue: string;
        };
        successToastMessage: string;
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Wrap in div change
 ************************************************************************/
export interface WrapDivChangeFields {
    codebaseIdsToWrap: string[];
}
export declare class WrapDivChange extends ChangeLedgerItem<WrapDivChangeFields> {
    constructor(changeFields: WrapDivChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            reactElements: any[];
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Duplicate change
 ************************************************************************/
export interface DuplicateChangeFields {
    codebaseIdsToDuplicate: string[];
}
export declare class DuplicateChange extends ChangeLedgerItem<DuplicateChangeFields> {
    constructor(changeFields: DuplicateChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            reactElements: any[];
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Change Tag Change
 ************************************************************************/
export interface ChangeTagChangeFields {
    codebaseIdToChange: string;
    newTagName: string;
}
export declare class ChangeTagChange extends ChangeLedgerItem<ChangeTagChangeFields> {
    constructor(changeFields: ChangeTagChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            elementToModify: any;
            newTag: string;
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Add class Change
 ************************************************************************/
export interface AddClassChangeFields {
    codebaseIdToAddClass: string;
    className: string;
    modifiers: string[];
    customProperties: ClassType[];
    addingTailwindClass?: boolean;
    cssEquivalent?: string;
    temporaryOnly?: boolean;
}
export declare class AddClassChange extends ChangeLedgerItem<AddClassChangeFields> {
    constructor(changeFields: AddClassChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            reactElement: any;
            className: string;
            stylingFramework: StylingFramework | null;
            modifiers: string[];
            customProperties: ClassType[];
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Remove class change
 ************************************************************************/
export interface RemoveClassChangeFields {
    codebaseIdToRemoveClass: string;
    className: string;
}
export declare class RemoveClassChange extends ChangeLedgerItem<RemoveClassChangeFields> {
    constructor(changeFields: RemoveClassChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            reactElement: any;
            className: string;
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Edit text change
 ************************************************************************/
export interface EditTextChangeFields {
    codebaseIdToEditText: string;
    newText: string;
    oldText?: string;
}
export declare class EditTextChange extends ChangeLedgerItem<EditTextChangeFields> {
    constructor(changeFields: EditTextChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            element: any;
            newText: string;
            oldText: string | undefined;
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
export type AnyChangeLedgerItem = ChangeLedgerItem<any>;
/************************************************************************
 * Undo Change Type
 ************************************************************************/
export interface UndoChangeFields {
    changeToUndo: AnyChangeLedgerItem;
    matchingActivityFlushed?: boolean;
}
export declare class UndoChange extends ChangeLedgerItem<UndoChangeFields> {
    constructor(changeFields: UndoChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            latestUuid: string | undefined;
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Redo Change Type
 ************************************************************************/
export interface RedoChangeFields {
    changeToRedo: AnyChangeLedgerItem;
}
export declare class RedoChange extends ChangeLedgerItem<RedoChangeFields> {
    constructor(changeFields: RedoChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {
            changeToRedoId: string | undefined;
        };
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/************************************************************************
 * Unknown Change Type
 *
 * This change type is created from the activity stream when the change
 * ledger goes out of sync with it. This allows the user to still undo
 * that change.
 *
 * This can happen if for example a canvas is being shared and another
 * user makes a change in between this users' changes
 ************************************************************************/
export interface UnknownChangeFields {
}
export declare class UnknownChange extends ChangeLedgerItem<UnknownChangeFields> {
    constructor(changeFields: UnknownChangeFields, id?: string);
    prepareApiRequest(canvasId: string, treeElementLookup: {
        [codebaseId: string]: any;
    }, activeCanvas: any): {
        urlPath: string;
        body: {};
    };
    applyCodebaseIdChanges(prevIdToNewIdMap: {
        [prevId: string]: string;
    }): void;
}
/**
 * When serializing a change ledger item to a plain JS object, the class functions
 * are lost. This recreates the change item that was lost
 */
export declare const reconstructChangeLedgerClass: (plainJsObject: {
    [key: string]: any;
}) => AnyChangeLedgerItem | null;
export {};
