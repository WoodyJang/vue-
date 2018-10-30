import Vue from './instance/index'                  //1、引用他暴露的vue构造器 // 3、暴露vue
import { initGlobalAPI } from './global-api/index'   
import { isServerRendering } from 'core/util/env'    

initGlobalAPI(Vue)      //2、调用initGlobalAPI,定义全局资源, 将 Vue 构造函数作为参数，传递给 initGlobalAPI 方法，该方法来自 ./global-api/index.js 文件

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

Vue.version = '__VERSION__'   //该值最终会被替代 scripts/config.js 文件, genConfig 方法

export default Vue


//源码的主入口主要做三件事
