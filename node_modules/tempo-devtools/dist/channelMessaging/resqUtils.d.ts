/**
 * Taken from https://github.com/baruchvlz/resq/blob/master/src/utils.js
 * but improved to work with all versions of react
 */
export declare const findReactInstance: (element: any) => any;
export declare const getRootReactElement: () => any;
export declare const buildNodeTree: (element: any, parentTreeNode: any) => any;
export declare const getDomElementForReactNode: (node: any) => any;
export declare const getUniqueLoookupFromReactTreeNode: (node: any) => string | null;
export declare const addUniqueLoookupToReactTreeNode: (node: any, uniqueLookup: string) => boolean;
export declare const removeUniqueLoookupFromReactTreeNode: (node: any) => boolean;
/**
 * Builds a lookup map with generated uuids that are added to the HTML elements under the hood as classes.
 * Make sure to clear the lookups from the tree after you are done with it.
 * @param tree
 * @param map
 */
export declare const buildTreeLookupMap: (tree: any, map: {
    [key: string]: any;
}) => void;
/**
 * Build tree lookup map adds a class name for lookups, we want to remove these after the tree is built
 * @param tree
 */
export declare const clearLookupsFromTree: (tree: any) => void;
export declare const getElementName: (type: any) => any;
/**
 * @param tree
 * @param searchFn
 * @param firstOnly if set, returns only the first element in a breadth-firth search
 * @returns
 */
export declare const findElementInTree: (tree: any, searchFn: (node: any) => boolean, firstOnly?: boolean) => any[];
