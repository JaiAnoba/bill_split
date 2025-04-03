import { AnyChangeLedgerItem } from './changeLedgerTypes';
export declare const WRAP_IN_DIV_PLACEHOLDER_CODEBASE_ID = "tempo-wrap-in-div-placeholder";
export declare const DUPLICATE_PLACEHOLDER_PREFIX = "tempo-duplicate-placeholder-";
export declare const ADD_JSX_PREFIX = "tempo-add-jsx-placeholder-";
export declare const ADD_CLASS_INSTANT_UPDATE_QUEUE = "ADD_CLASS_INSTANT_UPDATE_QUEUE";
export declare const TEMPORARY_STYLING_CLASS_NAME = "arb89-temp-styling";
export declare const applyChangeItemToDocument: (parentPort: any, storyboardId: string, plainChangeItem: AnyChangeLedgerItem) => {
    sendNewNavTree: boolean;
    instantUpdateSuccessful: boolean;
};
/**
 * After a change is processed on the backend, we need to update the codebase ids in the document.
 */
export declare const updateCodebaseIds: (parentPort: any, prevIdToNewIdMap: {
    [prevCodebaseId: string]: string;
}, updateElementKeys?: boolean) => boolean;
