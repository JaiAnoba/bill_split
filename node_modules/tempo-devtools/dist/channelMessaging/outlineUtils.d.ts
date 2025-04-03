export declare const PRIMARY_OUTLINE_COLOUR = "#4597F7";
export declare const SECONDARY_OUTLINE_COLOUR = "#4597F7";
export declare const PRIMARY_COMPONENT_OUTLINE_COLOR = "#6183e4";
export declare enum OutlineType {
    PRIMARY = 0,
    SECONDARY = 1,
    CHILD = 2,
    MOVE = 3
}
export declare const getOutlineElement: (parentPort: any, type: OutlineType, pageLeft: number, pageTop: number, width: number, height: number, selected?: boolean, tagName?: string, isComponent?: boolean, elementKey?: string) => HTMLDivElement;
export declare const clearAllOutlines: () => void;
/**
 * Creates all the necessary outlines for the hovered and selected elements
 * @returns
 */
export declare const updateOutlines: (parentPort: any, storyboardId: string) => void;
export declare const isNodeOutline: (node: any) => boolean;
