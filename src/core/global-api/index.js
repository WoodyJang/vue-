/* @flow */

import config from '../config'                     
import { initUse } from './use'                    
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)   //【vue.config】各种全局配置项

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {            //【vue.util】各种工具函数，还有一些兼容性的标志位（哇，不用自己判断浏览器了，Vue已经判断好了）
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  Vue.options = Object.create(null)        //【Vue.options】 这个options和我们上面用来构造实例的options不一样。这个是Vue默认提供的资源（组件指令过滤器）
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  extend(Vue.options.components, builtInComponents)

  initUse(Vue)                //【Vue.use】 通过initUse方法定义
  initMixin(Vue)              //【Vue.mixin】 通过initMixin方法定义
  initExtend(Vue)             //【Vue.extend】通过initExtend方法定义
  initAssetRegisters(Vue)
}
