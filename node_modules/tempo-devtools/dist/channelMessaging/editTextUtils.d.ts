import { TempoElement } from './tempoElement';
/**
 * Evaluates if the element's text can be edited in place.
 *
 * @param element
 */
export declare const canEditText: (element: TempoElement) => boolean;
/**
 * Returns if the node has text contents in the DOM
 */
export declare const hasTextContents: (node?: HTMLElement) => boolean;
/**
 * Evaluates if there's currently an element being edited.
 */
interface EditingInfo {
    key: string;
    originalText: string;
}
export declare const currentlyEditing: () => boolean;
export declare const getEditingInfo: () => EditingInfo | null;
/**
 * Takes an element and registers it as an editable text element.
 * Mutates the DOM to make the element editable.
 */
export declare const setupEditableText: (element: TempoElement, parentPort: any, storyboardId: string) => void;
/**
 * Used to mark the completion of the editable text process.
 * Reverts the DOM to its original state.
 * Sends a message to the housing frame with updated text, if necessary.
 *
 */
export declare const teardownEditableText: (parentPort: any, storyboardId: string) => void;
export {};
