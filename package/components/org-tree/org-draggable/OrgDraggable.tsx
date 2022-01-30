import {computed, defineComponent, onMounted, PropType, reactive, ref, watch} from 'vue';
import {addEvent, matchesSelectorToParentElements, removeEvent} from '../../../utils/dom';
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
            default: true
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

    setup: function (props, {attrs, slots, emit}) {
        const node = ref();
        const data: DraggableProps = reactive({
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
            left: props.x,
            top: props.y,
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
            minLeft: 0,
            maxLeft: 0,
            minRight: 0,
            maxRight: 0,
            minTop: 0,
            maxTop: 0,
            minBottom: 0,
            maxBottom: 0
        });

        const resetBoundsAndMouseState = () => {
            console.log('resetBoundsAndMouseState');
            mouseClickPosition.x = 0;
            mouseClickPosition.y = 0;
            mouseClickPosition.w = 0;
            mouseClickPosition.h = 0;
            mouseClickPosition.mouseX = 0;
            mouseClickPosition.mouseY = 0;
            bounds.minLeft = 0;
            bounds.maxLeft = 0;
            bounds.minRight = 0;
            bounds.maxRight = 0;
            bounds.minTop = 0;
            bounds.maxTop = 0;
            bounds.minBottom = 0;
            bounds.maxBottom = 0;
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

        const onBeforeUnmount = () => {
            // 卸载 事件
            removeEvent(document.documentElement, 'mousedown', deselect);
            removeEvent(document.documentElement, 'touchstart', handleUp);
            removeEvent(document.documentElement, 'mousemove', move);
            removeEvent(document.documentElement, 'touchmove', move);
            removeEvent(document.documentElement, 'mouseup', handleUp);
            removeEvent(document.documentElement, 'touchend touchcancel', deselect);

            removeEvent(window, 'resize', checkParentSize);
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

        // 触摸开始
        const elementTouchDown = (e: any) => {
            console.log('touch move');
            eventsFor = events.touch;
            elementDown(e);
        };
        // 鼠标开始
        const elementMouseDown = (e: any) => {
            console.log('mouse move');
            eventsFor = events.mouse;
            elementDown(e);
        };

        const deselect = (e: any) => {
            // const target = e.target;
            // if (!this.$el.contains(target)) {
            // console.log('deselect');
            // // todo 选择 在 本盒子里面做点击事件
            // if (data.enabled && !props.preventDeactivation) {
            //     data.enabled = false;
            //     emit('deactivated');
            //     emit('update:active', false);
            // }
            // // }
            resetBoundsAndMouseState();
        };
        const handleUp = () => {
            // 鼠标释放
            console.log('鼠标释放');
            resetBoundsAndMouseState();
            if (data.dragging) {
                data.dragging = false;
                emit('on-dragstop', data.left, data.top);
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

            const tmpDeltaX = axis && axis !== 'y' ? mouseClickPosition.mouseX - (e.touches ? e.touches[0].pageX : e.pageX) : 0;
            const tmpDeltaY = axis && axis !== 'x' ? mouseClickPosition.mouseY - (e.touches ? e.touches[0].pageY : e.pageY) : 0;
            const [deltaX, deltaY] = snapToGrid(grid, tmpDeltaX, tmpDeltaY, props.scale);
            const left = restrictToBounds(mouseClickPosition.left - deltaX, bounds.minLeft, bounds.maxLeft);
            const top = restrictToBounds(mouseClickPosition.top - deltaY, bounds.minTop, bounds.maxTop);
            // console.log('top', mouseClickPosition.top - deltaY, bounds.minTop, bounds.maxTop);
            if (props.onDrag(left, top) === false) {
                return;
            }

            const right = restrictToBounds(mouseClickPosition.right + deltaX, bounds.minRight, bounds.maxRight);
            const bottom = restrictToBounds(mouseClickPosition.bottom + deltaY, bounds.minBottom, bounds.maxBottom);
            console.log('bot', mouseClickPosition.bottom + deltaY, bounds.minBottom, bounds.maxBottom);
            data.left = left;
            data.top = top;
            data.right = right;
            data.bottom = bottom;
            emit('on-dragging', data.left, data.top);
        };

        const elementDown = (e: any) => {
            if (e instanceof MouseEvent && e.button !== 0) {
                return;
            }
            console.info('MouseEvent');

            const target = e.target;
            if (props.onDragStart(e) === false) {
                return;
            }

            if (
                (props.dragHandle && !matchesSelectorToParentElements(target, props.dragHandle, node.value)) ||
                (props.dragCancel && matchesSelectorToParentElements(target, props.dragCancel, node.value))
            ) {
                data.dragging = false;
                return;
            }

            if (!data.enabled) {
                data.enabled = true;

                emit('activated');
                emit('update:active', true);
            }

            if (props.draggable) {
                data.dragging = true;
            }

            mouseClickPosition.mouseX = e.touches ? e.touches[0].pageX : e.pageX;
            mouseClickPosition.mouseY = e.touches ? e.touches[0].pageY : e.pageY;

            mouseClickPosition.left = data.left;
            mouseClickPosition.right = data.right;
            mouseClickPosition.top = data.top;
            mouseClickPosition.bottom = data.bottom;

            if (props.parent) {
                console.log(props.parent);
                // todo 优化这里的赋值函数
                const {minLeft, maxLeft, minTop, maxTop, minRight, maxRight, minBottom, maxBottom} = calcDragLimits();
                bounds.maxLeft = maxLeft;
                bounds.minLeft = minLeft;
                bounds.maxRight = maxRight;
                bounds.minRight = minRight;
                bounds.maxTop = maxTop;
                bounds.minTop = minTop;
                bounds.maxBottom = maxBottom;
                bounds.minBottom = minBottom;
                console.log(bounds.maxLeft, bounds.minLeft, bounds.maxTop, bounds.minTop);
            }

            addEvent(document.documentElement, eventsFor.move, move);
            addEvent(document.documentElement, eventsFor.stop, handleUp);
        };

        const calcDragLimits = () => {
            return {
                minLeft: -data.parentWidth * 0.5,
                maxLeft: data.parentWidth * 0.5,
                minRight: -data.parentWidth * 0.5,
                maxRight: data.parentWidth * 0.5,
                minTop: 0,
                maxTop: data.parentHeight * 0.9,
                minBottom: -data.parentHeight * 0.5,
                maxBottom: data.parentHeight
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

        watch(
            () => props.active,
            () => {
                data.enabled = props.active;
                if (data.enabled) {
                    emit('activated');
                } else {
                    emit('deactivated');
                }
            }
        );

        watch(
            () => props.z,
            value => {
                if (value >= 0 || value === 'auto') {
                    data.zIndex = value;
                }
            }
        );

        watch(
            () => props.x,
            value => {
                if (data.dragging) {
                    return;
                }

                if (props.parent) {
                    const {minLeft, maxLeft, minTop, maxTop, minRight, maxRight, minBottom, maxBottom} = calcDragLimits();
                    bounds.maxLeft = maxLeft;
                    bounds.minLeft = minLeft;
                    bounds.maxRight = maxRight;
                    bounds.minRight = minRight;
                    bounds.maxTop = maxTop;
                    bounds.minTop = minTop;
                    bounds.maxBottom = maxBottom;
                    bounds.minBottom = minBottom;
                }

                moveHorizontally(value);
            }
        );

        watch(
            () => props.y,
            value => {
                if (data.dragging) {
                    return;
                }

                if (props.parent) {
                    const {minLeft, maxLeft, minTop, maxTop, minRight, maxRight, minBottom, maxBottom} = calcDragLimits();
                    bounds.maxLeft = maxLeft;
                    bounds.minLeft = minLeft;
                    bounds.maxRight = maxRight;
                    bounds.minRight = minRight;
                    bounds.maxTop = maxTop;
                    bounds.minTop = minTop;
                    bounds.maxBottom = maxBottom;
                    bounds.minBottom = minBottom;
                }

                moveVertically(value);
            }
        );

        watch(
            () => props.lockAspectRatio,
            value => {
                if (value) {
                    data.aspectFactor = data.width / data.height;
                } else {
                    data.aspectFactor = undefined;
                }
            }
        );

        return () => {
            const {classNameActive, classNameDragging, classNameDraggable, draggable, className} = props;
            const {enabled, dragging} = data;
            return (
                <div
                    ref={node}
                    class={{
                        [classNameActive]: enabled,
                        [classNameDragging]: dragging,
                        [classNameDraggable]: draggable,
                        [className]: className
                    }}
                    style={styleRef.value}
                    onMousedown={elementMouseDown}
                    onTouchstart={elementTouchDown}
                >
                    {slots.default ? slots.default() : 'none'}
                </div>
            );
        };
    }
});
