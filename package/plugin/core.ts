import {log} from '../utils/log';

export default {
    install(Vue: any) {
        // 设置为 false 以阻止 vue 在启动时生成生产提示
        Vue.config.productionTip = false;
        Vue.prototype.$log = log;
    }
};
