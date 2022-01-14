export interface DraggableProps {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    widthTouched: boolean;
    heightTouched: boolean;
    aspectFactor: number | string;
    parentWidth: number;
    parentHeight: number;
    dragging: boolean;
    enabled: boolean;
    zIndex: number | string;
}

export interface ToolsProps {
    show: boolean;
    expand: boolean;
    scale: boolean;
    zoom: boolean;
    restore: boolean;
    fullscreen: boolean;
}

export type Recordable<T = any> = Record<string, T>;

export type ReadonlyRecordable<T = any> = Readonly<Record<string, T>>;
