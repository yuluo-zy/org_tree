// if (!Object.assign) {
//     Object.defineProperty(Object, 'assign', {
//         enumerable: false,
//         configurable: true,
//         writable: true,
//         value: function (target: any, firstSource: any) {
//             'use strict';
//             if (target === undefined || target === null) {
//                 console.log(firstSource);
//                 throw new TypeError('Cannot convert first argument to object');
//             }
//             const to = Object(target);
//             for (let i = 1; i < arguments.length; i++) {
//                 const nextSource = arguments[i];
//                 if (nextSource === undefined || nextSource === null) continue;
//                 const keysArray = Object.keys(Object(nextSource));
//                 for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
//                     const nextKey = keysArray[nextIndex];
//                     const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
//                     if (desc !== undefined && desc.enumerable) to[nextKey] = nextSource[nextKey];
//                 }
//             }
//             return to;
//         }
//     });
// }
// if (!Array.isArray) {
//     Object.defineProperty(Array, 'isArray', {
//         enumerable: false,
//         configurable: true,
//         writable: true,
//         value: function (target) {
//             return Object.prototype.toString.call(target) == '[object Array]';
//         }
//     });
// }
// // 兼容ie数组没有findIndex方法
// if (!Array.prototype.findIndex) {
//     Object.defineProperty(Array.prototype, 'findIndex', {
//         value: function (predicate) {
//             // 1. Let O be ? ToObject(this value).
//             if (this == null) {
//                 throw new TypeError('"this" is null or not defined');
//             }
//
//             const o = Object(this);
//
//             // 2. Let len be ? ToLength(? Get(O, "length")).
//             const len = o.length >>> 0;
//
//             // 3. If IsCallable(predicate) is false, throw a TypeError exception.
//             if (typeof predicate !== 'function') {
//                 throw new TypeError('predicate must be a function');
//             }
//
//             // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
//             const thisArg = arguments[1];
//
//             // 5. Let k be 0.
//             let k = 0;
//
//             // 6. Repeat, while k < len
//             while (k < len) {
//                 // a. Let Pk be ! ToString(k).
//                 // b. Let kValue be ? Get(O, Pk).
//                 // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
//                 // d. If testResult is true, return k.
//                 const kValue = o[k];
//                 if (predicate.call(thisArg, kValue, k, o)) {
//                     return k;
//                 }
//                 // e. Increase k by 1.
//                 k++;
//             }
//             // 7. Return -1.
//             return -1;
//         }
//     });
// }
