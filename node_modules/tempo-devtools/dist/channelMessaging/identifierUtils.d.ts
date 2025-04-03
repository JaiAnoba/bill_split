export declare const ELEMENT_KEY_PREFIX = "arb89-key-";
export declare const UNIQUE_LOOKUP_PREFIX = "arb89-lookup-";
export declare const OUTLINE_CLASS = "arb89-outline";
export declare const EDIT_TEXT_BUTTON = "arb89-edit-text-button";
export declare const TEMPO_INSTANT_DIV_DRAW_CLASS = "arb89-instant-div-draw";
export declare const TEMPO_MOVE_BETWEEN_PARENTS_OUTLINE = "arb89-move-between-parents-outline";
export declare const TEMPO_INSTANT_UPDATE_STYLING_PREFIX = "arb89-styling-";
export declare const TEMPO_DISPLAY_NONE_UNTIL_REFRESH_CLASS = "arb89-display-none-until-refresh";
export declare const TEMPO_DELETE_AFTER_INSTANT_UPDATE = "arb89-delete-after-instant-update";
export declare const TEMPO_INSTANT_UPDATE = "arb89-instant-update";
export declare const TEMPO_DELETE_AFTER_REFRESH = "arb89-delete-after-refresh";
export declare const TEMPO_OUTLINE_UNTIL_REFESH = "arb89-outline-until-refresh";
export declare const TEMPO_DO_NOT_SHOW_IN_NAV_UNTIL_REFRESH = "arb89-do-not-show-in-nav";
export declare const TEMPO_ELEMENT_ID = "tempoelementid";
export declare const TEMPO_TEST_ID = "data-testid";
export declare const TEMPO_QUEUE_DELETE_AFTER_HOT_RELOAD = "arb89-queue-delete-after-hot-reload";
export declare const KNOWN_ATTRIBUTES: Set<string>;
export declare const validateUuid: (uuid: string) => boolean;
export declare const getCodebaseIdFromClassName: (className: string) => string | null;
export declare const getCodebaseIdFromNode: (node: any) => string | null;
export declare const addElementKeyAsClass: (node: any, safeElementKey: string) => void;
export declare const addUniqueLookupAsClass: (node: any, uniqueLookup: string) => void;
export declare const addCodebaseIdToNode: (node: any, codebaseId: string) => void;
export declare const getElementKeyFromNode: (node: any) => string | null;
export declare const getUniqueLookupFromNode: (node: any) => string | null;
export declare const removeUniqueLookupFromNode: (node: any) => boolean;
export declare const hasClass: (node: any, klass: string) => boolean;
export declare const isOutline: (node: any) => boolean;
export declare const getAllUnknownClasesFromList: (classes: string[]) => string[];
export declare const getAllUnknownClasses: (node: any) => string[];
/**
 * Accepts a node from mutation observer and determines if it's a moving element.
 * Returns moving if and only if the node has the attribute `arb89-instant-update` set to true.
 * @param node
 * @returns
 */
export declare const isMovingElement: (node: any) => boolean;
export declare const isSkipNavTreeNode: (node: any) => boolean | undefined;
/**
 * Check if the node has any parent that is an svg tag
 */
export declare const isElementInSvg: (node: any, parent?: boolean) => boolean;
