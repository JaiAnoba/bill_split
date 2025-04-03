import { PluginOption } from 'vite';
interface TempoOptions {
    pagesDir?: string;
    baseRoute?: string;
    pathToGlobalStyles?: string;
}
export declare function tempo(options?: TempoOptions): PluginOption[];
export {};
