<template>
    <p>msg="Welcome to Your Vue.js + TypeScript App"</p>
    <div style="height: 500px; border: 10px solid #eee">
        <TreeOrg
            :data="data"
            :disabled="info.disaled"
            :horizontal="info.horizontal"
            :collapsable="info.collapsable"
            :label-style="info.style"
            :node-draggable="true"
            :only-one-node="info.onlyOneNode"
            :clone-node-drag="info.cloneNodeDrag"
            :node-draging="nodeDragMove"
            :node-drag-end="nodeDragEnd"
            @on-contextmenu="onMenus"
            @on-expand="onMenus"
            @on-node-click="onMenus"
            @on-node-dblclick="onMenus"
            @on-node-copy="onMenus"
        >
        </TreeOrg>
    </div>
</template>

<script lang="ts">
import {defineComponent, reactive} from 'vue';
import TreeOrg from '../package/components/org-tree/tree-org/TreeOrg';

export default defineComponent({
    name: 'App',
    components: {TreeOrg},
    setup() {
        const data = {
            id: 1,
            label: 'xxx科技有限公司',
            children: [
                {
                    id: 2,
                    pid: 1,
                    label: '产品研发部',
                    style: {color: '#fff', background: '#108ffe'},
                    children: [
                        {
                            id: 6,
                            pid: 2,
                            label: '禁止编辑节点',
                            disabled: true
                        },
                        {
                            id: 7,
                            pid: 2,
                            label: '研发-后端'
                        },
                        {
                            id: 8,
                            pid: 2,
                            label: '禁止拖拽节点',
                            noDragging: true
                        },
                        {
                            id: 9,
                            pid: 2,
                            label: '产品经理'
                        },
                        {
                            id: 10,
                            pid: 2,
                            label: '测试'
                        }
                    ]
                },
                {
                    id: 3,
                    pid: 1,
                    label: '客服部',
                    children: [
                        {
                            id: 11,
                            pid: 3,
                            label: '客服一部'
                        },
                        {
                            id: 12,
                            pid: 3,
                            label: '客服二部'
                        }
                    ]
                },
                {
                    id: 4,
                    pid: 1,
                    label: '业务部'
                },
                {
                    id: 5,
                    pid: 1,
                    label: '人力资源中心'
                }
            ]
        };
        const nodeDragMove = (data: any) => {
            console.log(data);
        };
        const nodeDragEnd = (data: any, isSelf: any) => {
            console.log(data, isSelf);
            isSelf && console.info('移动到自身');
        };
        const onMenus = ({node, command}: any) => {
            console.log(node, command);
        };
        const info = reactive({
            horizontal: false,
            collapsable: true,
            onlyOneNode: true,
            cloneNodeDrag: true,
            expandAll: true,
            disaled: false,
            style: {
                background: '#fff',
                color: '#5e6d82'
            }
        });

        const toggleExpand = (data: any, val: any) => {
            if (Array.isArray(data)) {
                data.forEach(item => {
                    item['expand'] = val;
                    if (item.children) {
                        toggleExpand(item.children, val);
                    }
                });
            } else {
                data['expand'] = val;
                if (data.children) {
                    toggleExpand(data.children, val);
                }
            }
        };

        return {
            data,
            info,
            nodeDragMove,
            nodeDragEnd,
            onMenus
        };
    }
});
</script>

<style lang="less">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
