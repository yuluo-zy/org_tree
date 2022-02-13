import {computed, defineComponent, nextTick, PropType, reactive, ref} from 'vue';
import '../../../styles/index.less';
import {Recordable, ToolsProps} from '../../../type';
import OrgDraggable from '../org-draggable/OrgDraggable';
import nodedrag from '../../../directives/drag';
import TreeOrgNode from './node';

export default defineComponent({
    name: 'tree-org',
    props: {
        data: {
            type: Object as PropType<Recordable>,
            required: true
        },
        draggable: {
            // 是否可拖拽移动位置
            type: Boolean,
            default: true
        },
        draggableOnNode: {
            // 是否可拖拽节点移动位置
            type: Boolean,
            default: false
        },
        nodeDraggable: {
            // 节点是否可拖拽
            type: Boolean,
            default: true
        },
        nodeDragStart: Function,
        nodeDraging: Function,
        nodeDragEnd: Function,
        horizontal: Boolean,
        collapsable: Boolean
    },

    directives: {
        // 自定义指令
        nodedrag: nodedrag
    },
    setup(props, {emit}) {
        const container = ref();
        const treeOrg = ref();
        const data = reactive({
            keys: {
                id: 'id',
                pid: 'pid',
                label: 'label',
                expand: 'expand',
                children: 'children'
            },
            scale: 1,
            expanded: false,
            left: 0,
            top: 0,
            dragging: true,
            autoDragging: false,
            fullscreen: false,
            nodeMoving: false
        });

        const zoomStyle = computed(() => {
            return {
                width: `${100 / data.scale}%`,
                height: `${100 / data.scale}%`,
                transform: `scale(${data.scale})`
            };
        });
        const dragCancel = computed(() => {
            return props.draggableOnNode || !props.nodeDraggable ? '' : '.tree-org-node-label';
        });

        const zoomPercent = computed(() => {
            return `${Math.round(data.scale * 100)}%`;
        });

        const expandTitle = computed(() => {
            return data.expanded ? '收起全部节点' : '展开全部节点';
        });
        const fullTiltle = computed(() => {
            return data.fullscreen ? '退出全屏' : '全屏';
        });
        const nodeargs = computed(() => {
            return {
                drag: props.nodeDraggable,
                handleStart: props.nodeDragStart,
                handleMove: props.nodeDraging,
                handleEnd: props.nodeDragEnd
            };
        });

        const zoomWheel = (e: any) => {
            e.preventDefault();
            // 鼠标滚轮缩放
            if (e.deltaY > 0) {
                narrowOrgchart();
            } else {
                enlargeOrgchart();
            }
            emit('on-zoom', data.scale);
        };

        const narrowOrgchart = () => {
            // 鼠标滚轮向下滚动缩小
            if (Number(data.scale) > 0.3) {
                const scale = Number(data.scale) - 0.1;
                data.scale = Number(Number(scale).toFixed(1));
            }
        };

        const enlargeOrgchart = () => {
            // 鼠标滚轮向上滚动放大
            if (Number(data.scale) < 3) {
                const scale = Number(data.scale) + 0.1;
                data.scale = Number(Number(scale).toFixed(1));
            }
        };

        const tools: ToolsProps = reactive({
            show: true,
            expand: true,
            scale: true,
            zoom: true,
            restore: true,
            fullscreen: true
        });

        const expandChange = () => {
            data.expanded = !data.expanded;
            toggleExpand(props.data, data.expanded);
            if (!data.expanded) {
                nextTick(() => {
                    console.error('回调');
                    onDragStop(data.left, data.top);
                }).then();
            }
        };

        /**
         * 递归 扩展
         * @param data
         * @param val
         */
        const toggleExpand = (data: Recordable, val: boolean) => {
            if (Array.isArray(data)) {
                data.forEach(item => {
                    item['expand'] = val;
                    if (item.children) {
                        toggleExpand(item.children, val);
                    }
                });
            } else {
                data.expand = val;
                if (data.children) {
                    toggleExpand(data.children, val);
                }
            }
        };

        /**
         * 拖动事件
         * @param x
         * @param y
         */
        const onDrag = (x: number, y: number) => {
            console.log('拖动');
            data.dragging = true;
            data.autoDragging = false;
            data.left = x;
            data.top = y;
            emit('on-drag', {x, y});
        };

        /**
         * 拖动停止
         * @param x
         * @param y
         */
        const onDragStop = (x: number, y: number) => {
            // 防止拖拽出边界
            console.log('拖动停止');
            data.dragging = false;
            const zoom = treeOrg.value;
            const orgchart = container.value;

            const maxX = zoom.clientWidth / 2;
            const maxY = zoom.clientHeight / 2;
            let minY = zoom.clientHeight - orgchart.clientHeight;
            let minX = zoom.clientWidth - orgchart.clientWidth;
            if (minY > 0) {
                minY = 0;
            }
            if (minX > 0) {
                minX = 0;
            }
            if (x > maxX) {
                data.left = maxX;
            } else if (x < minX) {
                data.left = minX;
            } else {
                data.left = x;
            }
            if (y < minY) {
                data.top = minY;
            } else if (y > maxY) {
                data.top = maxY;
            } else {
                data.top = y;
            }
            emit('on-drag-stop', {x, y});
        };

        const nodeMouseenter = (e: any, data: any) => {
            if (data.nodeMoving) {
                data.parenNode = data;
            }
            emit('on-node-mouseenter', e, data);
        };
        const nodeMouseleave = (e: any, data: any) => {
            if (data.nodeMoving) {
                data.parenNode = null;
            }
            emit('on-node-mouseleave', e, data);
        };
        const nodeContextmenu = (e: any, data: any) => {
            e.stopPropagation();
            e.preventDefault();
            data.contextmenu = true;
            data.menuX = e.clientX;
            data.menuY = e.clientY;
            data.menuData = data;
        };

        const restoreOrgchart = () => {
            data.scale = 1;
            data.left = 0;
            data.top = 0;
        };
        const autoDrag = (el: any, left: number, top: number) => {
            data.autoDragging = true;
            data.dragging = false;
            const x = el.offsetLeft - left;
            const y = el.offsetTop - top;
            data.left -= x;
            data.top -= y;
        };

        const handleFullscreen = () => {
            data.fullscreen = !data.fullscreen;
            if (data.fullscreen) {
                launchIntoFullscreen();
            } else {
                exitFullscreen();
            }
        };

        const launchIntoFullscreen = () => {
            // 全屏
            const element = treeOrg.value;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            }
        };

        const exitFullscreen = () => {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        };

        const slots = {
            default: (node: any) => [
                <div class="tree-org-node__text">
                    <span>{node.label}</span>
                </div>
            ],
            expand: (node: any) => [<span class="tree-org-node__expand-btn">{node}</span>]
        };

        const handleExpand = (e: any, data: any) => {
            e.stopPropagation();
            const el = document.querySelector('.is-root');
            // const left = el.offsetLeft;
            // const top = el.offsetTop;
            // if ("expand" in data) {
            //     data.expand = !data.expand;
            //     if (!data.expand && data.children) {
            //         this.collapse(data.children);
            //     }
            // } else {
            //     this.$set(data, "expand", true);
            // }
            // this.$nextTick(() => {
            //     this.autoDrag(el, left, top);
            // });
            // this.$emit('on-expand', e, data)
        };

        return () => {
            return (
                <div ref={treeOrg} class="zm-tree-org">
                    <div ref={container} class="zoom-container" style={zoomStyle.value} onWheel={zoomWheel}>
                        <OrgDraggable
                            x={data.left}
                            y={data.top}
                            on-dragging={onDrag}
                            on-dragstop={onDragStop}
                            draggable={props.draggable}
                            drag-cancel={dragCancel.value}
                            class={{dragging: data.autoDragging}}
                        >
                            <div
                                ref="tree-item"
                                class={{
                                    'tree-org': true,
                                    horizontal: props.horizontal,
                                    collapsable: props.collapsable
                                }}
                            >
                                <TreeOrgNode v-nodedrag_l_t={nodeargs} data={props.data} on-expand={handleExpand} on-node-click={handleExpand}>
                                    {/*:props="keys"*/}
                                    {/*:horizontal="horizontal"*/}
                                    {/*:label-style="labelStyle"*/}
                                    {/*:collapsable="collapsable"*/}
                                    {/*:render-content="renderContent"*/}
                                    {/*:label-class-name="labelClassName"*/}
                                    {/*v-nodedrag.l.t="nodeargs"*/}
                                    {/*@on-node-dblclick="handleDblclick"*/}
                                    {/*@on-node-mouseenter="nodeMouseenter"*/}
                                    {/*@on-node-mouseleave="nodeMouseleave"*/}
                                    {/*@on-node-contextmenu="nodeContextmenu"*/}
                                    {/*@on-node-focus="(e, data) => {$emit('on-node-focus', e, data)}"*/}
                                    {/*@on-node-blur="handleBlur"*/}
                                    {slots}
                                </TreeOrgNode>
                            </div>
                            {/*<div>*/}
                            {/*    <p>kljhlkjj</p>*/}
                            {/*</div>*/}
                        </OrgDraggable>
                    </div>
                    {tools.show && (
                        <div class="zm-tree-handle">
                            {tools.scale && <div class="zm-tree-percent">{zoomPercent.value}</div>}
                            {tools.expand && (
                                <div onClick={expandChange} title={expandTitle.value} class="zm-tree-handle-item">
                                    <span class="zm-tree-svg">
                                        <i class={['iconfont', data.expanded ? 'icon-collapse' : 'icon-expand']} />
                                    </span>
                                </div>
                            )}
                            {tools.zoom && (
                                <div onClick={enlargeOrgchart} title="放大" class="zm-tree-handle-item zoom-out">
                                    <span class="zm-tree-icon">+</span>
                                </div>
                            )}
                            {tools.zoom && (
                                <div onClick={narrowOrgchart} title="缩小" class="zm-tree-handle-item zoom-in">
                                    <span class="zm-tree-icon">-</span>
                                </div>
                            )}
                            {tools.restore && (
                                <div onClick={restoreOrgchart} title="还原" class="zm-tree-handle-item">
                                    <span class="zm-tree-restore" />
                                </div>
                            )}
                            {tools.fullscreen && (
                                <div onClick={handleFullscreen} title={fullTiltle.value} class="zm-tree-handle-item">
                                    <span class="zm-tree-svg">
                                        <i class={['iconfont', data.fullscreen ? 'icon-unfullscreen' : 'icon-fullscreen']} />
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        };
    }
});
