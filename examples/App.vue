<template>
    <p>msg="Welcome to Your Vue.js + TypeScript App"</p>
    <div style="height: 500px; border: 10px solid #eee">
        <TreeOrg :data="{data}"></TreeOrg>
    </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
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
        return {
            data
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
