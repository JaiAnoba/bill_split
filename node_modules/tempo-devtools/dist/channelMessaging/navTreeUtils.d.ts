import { TempoElement } from './tempoElement';
export declare const UNKNOWN_PARENT_COMPONENT = "UnknownComponent";
export declare const TOP_LEVEL_PARENT_COMPONENT_TO_SKIP = "TOP_LEVEL_PARENT_COMPONENT_TO_SKIP";
export declare const EMPTY_TREE_CODEBASE_ID = "EMPTY-TREE";
export declare const SKIP_ROOT_CODEBASE_ID = "SKIP-ROOT";
export declare enum ExtractedPropType {
    LITERAL = "LITERAL",
    FUNCTION = "FUNCTION",
    JSON_OBJECT = "JSON_OBJECT"
}
export interface NavTreeNode {
    parent?: NavTreeNode;
    children: NavTreeNode[];
    tempoElement: TempoElement;
    name: string;
    elementTagName?: string;
    isComponent?: boolean;
    level?: number;
    classList?: string[];
    directlySetClassList?: string[];
    scope?: any;
    pageBoundingBox?: {
        pageX: number;
        pageY: number;
        width: number;
        height: number;
    };
    displayType?: string;
    positionType?: string;
    flexDirection?: string;
    floatVal?: string;
    reactFiberNode?: any;
    props?: {
        [key: string]: {
            value: any;
            type: ExtractedPropType;
        };
    };
    literalChildren?: {
        index: number;
        value: any;
    }[];
}
/**
 * Nav node for a component that has no DOM element associated with it
 */
export declare const getNavNodeForVirtualComponent: (parent: NavTreeNode, componentName: string, componentInstanceId: string | undefined, uniquePath: string, scopeLookup: {
    [codebaseId: string]: any;
}, storyboardId: string, reactFiberNode: any) => NavTreeNode;
export declare const buildNavForNode: (storyboardId: string, parent: NavTreeNode | undefined, node: any, uniquePathBase: string, uniquePathAddon: string, scopeLookup: {
    [codebaseId: string]: any;
}, treeElements: {
    [codebaseId: string]: any;
}, lookupIdToReactTreeMap: any, knownComponentNames: Set<string>, knownComponentInstanceNames: Set<string>, elementKeyToLookupList: {
    [elementKey: string]: string[];
}, elementKeyToNavNode: {
    [elementKey: string]: NavTreeNode;
}) => NavTreeNode | null;
interface CallbackOptions {
    callbackFn: Function;
    state: {
        selectedElementKey: string;
        multiSelectedElementKeys: string[];
    };
}
export declare const addNavTreeBuiltCallback: (callbackToAdd: CallbackOptions) => void;
export declare const runNavTreeBuiltCallbacks: () => void;
export {};
