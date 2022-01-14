import {isFunction} from './fns';
import {VNode} from 'vue';

export function matchesSelectorToParentElements(el: any, selector: any, baseNode: any) {
    let node = el;

    const matchesSelectorFunc = ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].find(func => isFunction(node[func]));
    if (!matchesSelectorFunc) return false;
    if (!isFunction(node[matchesSelectorFunc])) return false;
    do {
        if (node[matchesSelectorFunc](selector)) return true;
        if (node === baseNode) return false;
        node = node.parentNode;
    } while (node);
    return false;
}

export function getComputedSize(vNode: VNode) {
    // // const style = (vNode.);
    // return [style.getPropertyValue('width') ? parseFloat(style.getPropertyValue('width')) : 10, style.getPropertyValue('height') ? parseFloat(style.getPropertyValue('height')) : 10];
}

export function addEvent(el: any, event: any, handler: any) {
    if (!el) {
        return;
    }
    if (el.attachEvent) {
        el.attachEvent('on' + event, handler);
    } else if (el.addEventListener) {
        el.addEventListener(event, handler, true);
    } else {
        el['on' + event] = handler;
    }
}

export function removeEvent(el: any, event: any, handler: any) {
    if (!el) {
        return;
    }
    if (el.detachEvent) {
        el.detachEvent('on' + event, handler);
    } else if (el.removeEventListener) {
        el.removeEventListener(event, handler, true);
    } else {
        el['on' + event] = null;
    }
}
