import {computed, defineComponent, onMounted, PropType, reactive, ref} from 'vue';
import {addEvent, removeEvent} from '../../../utils/dom';
import {restrictToBounds, snapToGrid} from '../../../utils/fns';
import {DraggableProps} from '../../../type';

const events = {
    mouse: {
        start: 'mousedown',
        move: 'mousemove',
        stop: 'mouseup'
    },
    touch: {
        start: 'touchstart',
        move: 'touchmove',
        stop: 'touchend'
    }
};

const userSelectNone = {
    userSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
    MsUserSelect: 'none'
};

const userSelectAuto = {
    userSelect: 'auto',
    MozUserSelect: 'auto',
    WebkitUserSelect: 'auto',
    MsUserSelect: 'auto'
};

let eventsFor = events.mouse;

export default defineComponent({
    name: 'OrgDraggable',
    props: {
        className: {
            type: String,
            default: 'zm-draggable'
        },
        classNameDraggable: {
            type: String,
            default: 'draggable'
        },
        classNameDragging: {
            type: String,
            default: 'dragging'
        },
        classNameActive: {
            type: String,
            default: 'active'
        },
        disableUserSelect: {
            type: Boolean as PropType<boolean>,
            default: true
        },
        enableNativeDrag: {
            type: Boolean as PropType<boolean>,
            default: false
        },
        preventDeactivation: {
            type: Boolean as PropType<boolean>,
            default: false
        },
        active: {
            type: Boolean as PropType<boolean>,
            default: false
        },
        draggable: {
            type: Boolean as PropType<boolean>,
            default: true
        },
        resizable: {
            type: Boolean,
            default: true
        },
        lockAspectRatio: {
            type: Boolean,
            default: false
        },
        w: {
            type: [Number, String],
            default: 200,
            validator: (val: string | number) => {
                if (typeof val === 'number') {
                    return val > 0;
                }

                return val === 'auto';
            }
        },
        h: {
            type: [Number, String],
            default: 200,
            validator: (val: string | number) => {
                if (typeof val === 'number') {
                    return val > 0;
                }

                return val === 'auto';
            }
        },
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        },
        z: {
            type: [String, Number],
            default: 'auto',
            validator: (val: string | number) => (typeof val === 'string' ? val === 'auto' : val >= 0)
        },
        dragHandle: {
            type: String,
            default: ''
        },
        dragCancel: {
            type: String,
            default: ''
        },
        axis: {
            type: String,
            default: 'both',
            validator: (val: string) => ['x', 'y', 'both'].includes(val)
        },
        grid: {
            type: Array as PropType<number[]>,
            default: () => [1, 1]
        },
        parent: {
            type: Boolean as PropType<boolean>,
            default: false
        },
        parentNode: null,
        scale: {
            type: Number,
            default: 1,
            validator: (val: number) => val > 0
        },
        onDragStart: {
            type: Function,
            default: () => true
        },
        onDrag: {
            type: Function,
            default: () => true
        }
    },

    setup(props, {attrs, slots, emit}) {
        const node = ref();
        const data: DraggableProps = reactive({
            left: props.x,
            top: props.y,
            right: 0,
            bottom: 0,
            width: 0,
            height: 0,
            widthTouched: false,
            heightTouched: false,
            aspectFactor: 0,
            parentWidth: 0,
            parentHeight: 0,
            dragging: false,
            enabled: props.active,
            zIndex: props.z
        });

        const mouseClickPosition = reactive({
            mouseX: 0,
            mouseY: 0,
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        });
        const bounds = reactive({
            minLeft: null,
            maxLeft: null,
            minRight: null,
            maxRight: null,
            minTop: null,
            maxTop: null,
            minBottom: null,
            maxBottom: null
        });

        const resetBoundsAndMouseState = () => {
            mouseClickPosition.x = 0;
            mouseClickPosition.y = 0;
            mouseClickPosition.w = 0;
            mouseClickPosition.h = 0;
            mouseClickPosition.mouseX = 0;
            mouseClickPosition.mouseY = 0;
            bounds.minLeft = null;
            bounds.maxLeft = null;
            bounds.minRight = null;
            bounds.maxRight = null;
            bounds.minTop = null;
            bounds.maxTop = null;
            bounds.minBottom = null;
            bounds.maxBottom = null;
        };

        const ondragstart = ref(props.onDragStart);

        onMounted(() => {
            if (props.enableNativeDrag === true) {
                ondragstart.value = () => false;
            }
            const [parentWidth, parentHeight] = getParentSize.value;
            data.parentWidth = parentWidth;
            data.parentHeight = parentHeight;
            const rootEl = node.value;
            const width = rootEl.clientWidth;
            const height = rootEl.clientHeight;
            data.aspectFactor = (props.w !== 'auto' ? (props.w as number) : width) / (props.h !== 'auto' ? (props.h as number) : height);

            data.width = props.w !== 'auto' ? (props.w as number) : width;
            data.height = props.h !== 'auto' ? (props.h as number) : height;

            data.right = data.parentWidth - data.width - data.left;
            data.bottom = data.parentHeight - data.height - data.top;
            addEvent(document.documentElement, 'mousedown', deselect);
            addEvent(document.documentElement, 'touchend touchcancel', deselect);

            addEvent(window, 'resize', checkParentSize);
        });

        const beforeUnmount = () => {
            removeEvent(document.documentElement, 'mousedown', deselect);
            removeEvent(document.documentElement, 'touchstart', handleUp);
            removeEvent(document.documentElement, 'mousemove', move);
            removeEvent(document.documentElement, 'touchmove', move);
            removeEvent(document.documentElement, 'mouseup', handleUp);
            removeEvent(document.documentElement, 'touchend touchcancel', deselect);

            removeEvent(window, 'resize', checkParentSize);
        };

        const deselect = (e: any) => {
            const target = e.target;
            // if (!this.$el.contains(target)) {
            //     if (data.enabled && !props.preventDeactivation) {
            //         data.enabled = false;
            //
            //         emit('deactivated');
            //         emit('update:active', false);
            //     }
            // }
            resetBoundsAndMouseState();
        };
        const handleUp = () => {
            resetBoundsAndMouseState();
            if (data.dragging) {
                data.dragging = false;
                emit('dragstop', data.left, data.top);
            }
        };

        const move = (e: any) => {
            if (data.dragging) {
                handleDrag(e);
            }
        };

        const handleDrag = (e: any) => {
            const axis = props.axis;
            const grid = props.grid;
            const bound = bounds;

            const tmpDeltaX = axis && axis !== 'y' ? mouseClickPosition.mouseX - (e.touches ? e.touches[0].pageX : e.pageX) : 0;
            const tmpDeltaY = axis && axis !== 'x' ? mouseClickPosition.mouseY - (e.touches ? e.touches[0].pageY : e.pageY) : 0;

            const [deltaX, deltaY] = snapToGrid(grid, tmpDeltaX, tmpDeltaY, props.scale);

            const left = restrictToBounds(mouseClickPosition.left - deltaX, bound.minLeft, bound.maxLeft);
            const top = restrictToBounds(mouseClickPosition.top - deltaY, bound.minTop, bound.maxTop);

            if (props.onDrag(left, top) === false) {
                return;
            }

            const right = restrictToBounds(mouseClickPosition.right + deltaX, bound.minRight, bound.maxRight);
            const bottom = restrictToBounds(mouseClickPosition.bottom + deltaY, bound.minBottom, bound.maxBottom);

            data.left = left;
            data.top = top;
            data.right = right;
            data.bottom = bottom;
            emit('dragging', data.left, data.top);
        };

        const checkParentSize = () => {
            if (props.parent) {
                const [newParentWidth, newParentHeight] = getParentSize.value;
                data.parentWidth = newParentWidth;
                data.parentHeight = newParentHeight;
            }
        };

        const getParentSize = computed((): [number, number] => {
            const curNode = node.value;
            const parentNode = curNode.parentNode;
            return [parentNode.clientWidth, parentNode.clientHeight];
        });

        const elementTouchDown = (e: any) => {
            eventsFor = events.touch;
            elementDown(e);
        };

        const elementMouseDown = (e: any) => {
            eventsFor = events.mouse;
            elementDown(e);
        };

        const elementDown = (e: any) => {
            if (e instanceof MouseEvent && e.button !== 1) {
                return;
            }

            const target = e.target;

            // if (this.$el.contains(target)) {
            //     if (props.onDragStart(e) === false) {
            //         return;
            //     }
            //
            //     if (
            //         (props.dragHandle && !matchesSelectorToParentElements(target, props.dragHandle, this.$el)) ||
            //         (props.dragCancel && matchesSelectorToParentElements(target, props.dragCancel, this.$el))
            //     ) {
            //         data.dragging = false;
            //
            //         return;
            //     }
            //
            //     if (!data.enabled) {
            //         data.enabled = true;
            //
            //         emit('activated');
            //         emit('update:active', true);
            //     }
            //
            //     if (props.draggable) {
            //         data.dragging = true;
            //     }
            //
            //     mouseClickPosition.mouseX = e.touches ? e.touches[0].pageX : e.pageX;
            //     mouseClickPosition.mouseY = e.touches ? e.touches[0].pageY : e.pageY;
            //
            //     mouseClickPosition.left = data.left;
            //     mouseClickPosition.right = data.right;
            //     mouseClickPosition.top = data.top;
            //     mouseClickPosition.bottom = data.bottom;
            //
            //     if (props.parent) {
            //         Object.assign(bounds, {...calcDragLimits()});
            //     }
            //
            //     addEvent(document.documentElement, eventsFor.move, move);
            //     addEvent(document.documentElement, eventsFor.stop, handleUp);
            // }
        };

        const calcDragLimits = () => {
            return {
                minLeft: data.left % props.grid[0],
                maxLeft: Math.floor((data.parentWidth - data.width - data.left) / props.grid[0]) * props.grid[0] + data.left,
                minRight: data.right % props.grid[0],
                maxRight: Math.floor((data.parentWidth - data.width - data.right) / props.grid[0]) * props.grid[0] + data.right,
                minTop: data.top % props.grid[1],
                maxTop: Math.floor((data.parentHeight - data.height - data.top) / props.grid[1]) * props.grid[1] + data.top,
                minBottom: data.bottom % props.grid[1],
                maxBottom: Math.floor((data.parentHeight - data.height - data.bottom) / props.grid[1]) * props.grid[1] + data.bottom
            };
        };

        const moveHorizontally = (val: any) => {
            const [deltaX, _] = snapToGrid(props.grid, val, data.top, props.scale);

            const left = restrictToBounds(deltaX, bounds.minLeft, bounds.maxLeft);

            data.left = left;
            data.right = data.parentWidth - data.width - left;
        };
        const moveVertically = (val: any) => {
            const [_, deltaY] = snapToGrid(props.grid, data.left, val, props.scale);

            const top = restrictToBounds(deltaY, bounds.minTop, bounds.maxTop);

            data.top = top;
            data.bottom = data.parentHeight - data.height - top;
        };
        const styleRef = computed(() => {
            return {
                transform: `translate(${data.left}px, ${data.top}px)`,
                zIndex: data.zIndex,
                ...(data.dragging && props.disableUserSelect ? (userSelectNone as any) : userSelectAuto)
            };
        });

        return () => {
            const {classNameActive, classNameDragging, classNameDraggable, draggable} = props;
            const {enabled, dragging} = data;
            return (
                <div
                    ref={node}
                    class={{
                        [classNameActive]: enabled,
                        [classNameDragging]: dragging,
                        [classNameDraggable]: draggable
                    }}
                    style={styleRef.value}
                    onMousedown={elementMouseDown}
                    onTouchstart={elementTouchDown}
                >
                    {slots.default ? slots.default() : 'foo'}
                </div>
            );
        };
    }
});
