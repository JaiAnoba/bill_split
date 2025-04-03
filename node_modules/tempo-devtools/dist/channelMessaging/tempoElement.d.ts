/**
 * Used to uniquely identify an element in the DOM or a component in the nav tree.
 *
 * Created when building the nav tree
 */
export declare class TempoElement {
    readonly codebaseId: string;
    readonly storyboardId: string;
    readonly uniquePath: string;
    private cachedKey;
    /**
     * If codebase ID is undefined then it doesn't exist in our codebase, but is still a valid lookup
     */
    constructor(codebaseId: string | undefined, storyboardId: string, uniquePath: string);
    isEqual(other: TempoElement): boolean;
    getKey(): string;
    /**
     * Note, codebase ID is allowed to be empty but not the storyboard ID or unique path
     */
    isEmpty(): boolean;
    static fromKey(key: string): TempoElement;
    static fromOtherElement(other: TempoElement): TempoElement;
    static empty(): TempoElement;
    /**
     * Returns a tempo element that can be used to represent the storyboard itself
     */
    static forStoryboard(storyboardId: string): TempoElement;
    /**
     * If the storyboardId is passed in it checks if it is equal to this particular storyboard
     */
    isStoryboard(storyboardId?: string): boolean;
    /**
     * @returns if this element is inside a storyboard and known in the codebase
     */
    isKnownElement(): boolean;
    isParentOf(other?: TempoElement): boolean;
    isSiblingOf(other?: TempoElement): boolean;
}
