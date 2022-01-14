import {computed, defineComponent, nextTick, PropType, reactive, ref} from 'vue';
import '../../../styles/index.less';
import {ToolsProps, Recordable} from '../../../type';
export default defineComponent({
    name: 'tree-org',
    props: {
        data: {
            type: Object as PropType<Recordable>,
            required: true
        },
    },
    setup(props, {emit}) {
        const container = ref();
        const treeOrg = ref();
        const data = reactive({
            scale: 1,
            expanded: false,
            left: 0,
            top: 0,
            dragging: true,
            autoDragging: false
        });

        const zoomStyle = computed(() => {
            return {
                width: `${100 / data.scale}%`,
                height: `${100 / data.scale}%`,
                transform: `scale(${data.scale})`
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
                console.log('xia');
            }
        };

        const enlargeOrgchart = () => {
            // 鼠标滚轮向上滚动放大
            if (Number(data.scale) < 3) {
                const scale = Number(data.scale) + 0.1;
                data.scale = Number(Number(scale).toFixed(1));
                console.log('shang');
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
        const zoomPercent = computed(() => {
            return `${Math.round(data.scale * 100)}%`;
        });

        const expandChange = () =>  {
            data.expanded = !data.expanded
            toggleExpand(props.data, data.expanded);
            if(!data.expanded){
                nextTick(() => {
                   onDragStop(data.left, data.top);
                }).then();
            }
        };

        /**
         * 递归 扩展
         * @param data
         * @param val
         */
        const toggleExpand = (data: Recordable , val: boolean) =>  {
            if (Array.isArray(data)) {
                data.forEach(item => {
                    item["expand"] =  val
                    if (item.children) {
                        toggleExpand(item.children, val);
                    }
                });
            } else {
                data["expand"] =  val
                if (data.children) {
                    toggleExpand(data.children, val);
                }
            }
        }

        /**
         * 拖动事件
         * @param x
         * @param y
         */
       const  onDrag = (x: number, y: number) => {
            data.dragging = true;
            data.autoDragging = false;
            data.left = x;
            data.top = y;
            emit('on-drag', {x, y})
        };

        /**
         * 拖动停止
         * @param x
         * @param y
         */
        const onDragStop = (x: number, y: number) => {
            // 防止拖拽出边界
            data.dragging = false;
            const zoom = container.value;
            const orgchart = this.$refs["tree-org"];

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
                this.left = maxX;
            } else if (x < minX) {
                this.left = minX;
            } else {
                this.left = x;
            }
            if (y < minY) {
                this.top = minY;
            } else if (y > maxY) {
                this.top = maxY;
            } else {
                this.top = y;
            }
            this.$emit('on-drag-stop', {x, y})
        },


        return () => {
            const {show, scale} = tools;
            return (
                <div ref={treeOrg} class="zm-tree-org">
                    <div ref={container} class="zoom-container" style={zoomStyle.value} onWheel={zoomWheel}></div>

                    {/*工具条*/}
                    <div v-show={show}>
                        <div class="zm-tree-handle">
                            <div v-if={scale} class="zm-tree-percent">
                                {zoomPercent.value}
                            </div>
                        </div>
                        <div v-if="tools.expand" onClick={expandChange} :title="expandTitle" class="zm-tree-handle-item">
                        <span class="zm-tree-svg">
            <i :class="['iconfont', expanded ? 'icon-collapse' : 'icon-expand']"></i>
                        <!-- <img :src="svgUrl.expand" alt=""> -->
                    </span>
                </div>
                    </div>
                </div>
            );
        };
    }
});
