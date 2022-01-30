export function isFunction(func: any) {
    return typeof func === 'function' || Object.prototype.toString.call(func) === '[object Function]';
}

export function snapToGrid(grid: Array<number>, pendingX: number, pendingY: number, scale = 1) {
    const x = Math.round(pendingX / scale / grid[0]) * grid[0];
    const y = Math.round(pendingY / scale / grid[1]) * grid[1];

    return [x, y];
}

export function getSize(el: Element) {
    const rect = el.getBoundingClientRect();

    return [parseInt(String(rect.width)), parseInt(String(rect.height))];
}

export function restrictToBounds(value: number, min: number, max: number): number {
    if (value < min) {
        return min;
    }

    if (max < value) {
        return max;
    }

    return value;
}

export const isObject = function (arg: any) {
    return Object.prototype.toString.call(arg) === '[object Object]';
};
