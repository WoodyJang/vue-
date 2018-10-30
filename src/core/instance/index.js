//导入五个方法
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

//定义vue构造函数
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)    //init.js/initMixin里的_init方法
}

//将vue作为参数传递给导入的五个方法

initMixin(Vue)          //初始化的入口，各种初始化工作
stateMixin(Vue)         //数据绑定的核心方法，包括常用的$watch方法
eventsMixin(Vue)        //事件的核心方法，包括常用的$on，$off，$emit方法
lifecycleMixin(Vue)     //生命周期的核心方法
renderMixin(Vue)        //渲染的核心方法，用来生成render函数以及VNode

//导出vue
export default Vue
