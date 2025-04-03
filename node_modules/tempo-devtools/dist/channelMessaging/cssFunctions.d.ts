export declare const parse: import("css-selector-parser").Parser;
export interface CssRule {
    filename?: string;
    selector?: string;
    atrule?: string;
    codebaseId?: string;
    source?: any;
    styles?: {
        [cssKey: string]: string;
    };
    inherited?: boolean;
    applied?: boolean;
    removable?: boolean;
    allowChanges?: boolean;
    modifiers?: {
        [modifier: string]: boolean;
    };
    classParsed?: string;
    cssText?: any;
}
export declare const setModifiersForSelectedElement: (parentPort: any, modifiers: string[], selectedElementKey: string) => void;
export declare const processRulesForSelectedElement: (parentPort: any, cssElementLookup: any, selectedElementKey: string) => void;
export declare const cssEval: (element: any, property: string) => string;
export declare const getCssEvals: (parentPort: any, selectedElementKey: string) => void;
export declare const getElementClassList: (parentPort: any, selectedElementKey: string) => void;
export declare const ruleMatchesElement: (parentPort: any, messageId: string, rule: string, selectedElementKey: string) => void;
