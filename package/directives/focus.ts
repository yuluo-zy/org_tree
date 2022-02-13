export default {
    // beforeMount(el: any, {value}: any) {
    //     if (value) {
    //         el.focus();
    //     }
    // }
    beforeMount(el: any, binding: any) {
        if (binding.value) {
            el.focus();
        }
    }
};
