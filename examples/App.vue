<template>
    <p>msg="Welcome to Your Vue.js + TypeScript App"</p>
    <div style="height: 400px; border: 10px solid #eee">
        <TreeOrg> </TreeOrg>
    </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import TreeOrg from '../package/components/org-tree/tree-org/TreeOrg';

export default defineComponent({
    name: 'App',
    components: {TreeOrg}
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
