/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 */
export const observerState = {
  shouldConvert: true
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that has this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    /**
     * const data = {
          a: 1
        }
     * 那么经过 def 函数处理之后，data 对象应该变成如下这个样子：
     * const data = {
        a: 1,
        // __ob__ 是不可枚举的属性
        __ob__: {
          value: data, // value 属性指向 data 数据对象本身，这是一个循环引用
          dep: dep实例对象, // new Dep()
          vmCount: 0
        }
      }
     */
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // defineReactive(obj, keys[i], obj[keys[i]])
      // 在 walk 函数中调用 defineReactive 函数时暂时不获取属性值
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object, keys: any) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  /**
   * 用来判断如果要观测的数据不是一个对象或者是 VNode 实例，则直接 return
   */
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  //用来保存Observer实例
  let ob: Observer | void

  /**
   * 检测数据对象 value 自身是否含有 __ob__ 属性，并且 __ob__ 属性应该是 Observer 的实例
   */
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    /**
     * 如果为真则直接将数据对象自身的 __ob__ 属性的值作为 ob 的值：ob = value.__ob__
     * 那么 __ob__ 是什么呢？其实当一个数据对象被观测之后将会在该对象上定义 __ob__ 属性，所以 if 分支的作用是用来避免重复观测一个数据对象。
     */
    ob = value.__ob__
  } else if (

   /**
    * 创建一个 Observer 实例需要同时具备 5个条件：
    * 1、可以被观测
    * 2、不是服务器渲染
    * 3、被观测的对象是数组或者对象
    * 4、可拓展。以下三个方法都可以使得一个对象变得不可扩展：Object.preventExtensions()、Object.freeze() 以及 Object.seal()
    * 5、不是vue实例
    */

    observerState.shouldConvert &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * defineReactive 函数的核心就是 将数据对象的数据属性转换为访问器属性，即为数据对象的属性设置一对 getter/setter，但其中做了很多处理边界条件的工作
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
    const dep = new Dep();
    /**
     * 首先通过 Object.getOwnPropertyDescriptor 函数获取该字段可能已有的属性描述对象，并将该对象保存在 property 常量中，接着是一个 if 语句块，判断该字段是否是可配置的，如果不可配置(property.configurable === false)，那么直接 return ，即不会继续执行 defineReactive 函数。这么做也是合理的，因为一个不可配置的属性是不能使用也没必要使用 Object.defineProperty 改变其属性定义的。
     */
    const property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
      return;
    }

    // cater for pre-defined getter/setters
    // 缓存原有的getter/setter函数，因为下面会重写。再在重写的getter/setter函数中重新调用，从而做到不影响属性的原有读写操作。
    const getter = property && property.get;
    const setter = property && property.set;

    // 在 defineReactive 函数内获取属性值
    if ((!getter || setter) && arguments.length === 2) {
      val = obj[key]
    }
    // shallow为false，深度遍历，shallow不传时为undefined，即默认就是深度观测
    // childOb === data.a.__ob__
    let childOb = !shallow && observe(val);
    /**
     * const data = {
        a: {
          b: 1
        }
      }
      const data = {
        // 属性 a 通过 setter/getter 通过闭包引用着 dep 和 childOb
        a: {
          // 属性 b 通过 setter/getter 通过闭包引用着 dep 和 childOb
          b: 1
          __ob__: {a, dep, vmCount}
        }
        __ob__: {data, dep, vmCount}

        要注意的是，属性 a 闭包引用的 childOb 实际上就是 data.a.__ob__。而属性 b 闭包引用的 childOb 是 undefined，因为属性 b 是基本类型值，并不是对象也不是数组。
      }
     */
    Object.defineProperty(obj, key, {
      enumerable: true, //可枚举
      configurable: true, //不可再define
      /**
       * 我们知道依赖的收集时机就是属性被读取的时候，所以 get 函数做了两件事：正确地返回属性值以及收集依赖，
       */
      get: function reactiveGetter() {
        //调用原有的getter函数
        const value = getter ? getter.call(obj) : val;
        if (Dep.target) {
          dep.depend();
          if (childOb) {
          /**除了要将依赖收集到属性 a 自己的“筐”里之外，还要将同样的依赖收集到 data.a.__ob__.dep 这里”筐“里
           为什么要将同样的依赖分别收集到这两个不同的”筐“里呢？其实答案就在于这两个”筐“里收集的依赖的触发时机是不同的，即作用不同，两个”筐“如下：
            第一个”筐“是 dep
            第二个”筐“是 childOb.dep

            第一个”筐“里收集的依赖的触发时机是当属性值被修改时触发，即在 set 函数中触发：dep.notify()
            而第二个”筐“里收集的依赖的触发时机是在使用 $set 或 Vue.set 给数据对象添加新属性时触发
            Vue.set = function (obj, key, val) {
              defineReactive(obj, key, val)
              obj.__ob__.dep.notify() // 相当于 data.a.__ob__.dep.notify()
            }

            Vue.set(data.a, 'c', 1)
            __ob__ 属性以及 __ob__.dep 的主要作用是为了添加、删除属性时有能力触发依赖，而这就是 Vue.set 或 Vue.delete 的原理。
          */
            childOb.dep.depend();
            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }
        return value;
      },
      set: function reactiveSetter(newVal) {
        //调用原有的setter函数
        const value = getter ? getter.call(obj) : val;
        /* eslint-disable no-self-compare */
        /*
         * newVal !== newVal 说明新值与新值自身都不全等，同时旧值与旧值自身也不全等，大家想一下在 js 中什么时候会出现一个值与自身都不全等的？答案就是 NaN
         * NaN === NaN // false
        */
        if (newVal === value || (newVal !== newVal && value !== value)) {
          return;
        }
        /* eslint-enable no-self-compare */
        /**
         * initRender 函数中的一段代码：
         * defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
            !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
          }, true)
         * customSetter 函数的作用，用来打印辅助信息，当然除此之外你可以将 customSetter 用在任何适合使用它的地方
         */
        if (process.env.NODE_ENV !== "production" && customSetter) {
          customSetter();
        }
        if (setter) {
          setter.call(obj, newVal);
        } else {
          val = newVal;
        }
        /**
         * 为属性设置的新值是一个数组或者纯对象，那么该数组或纯对象是未被观测的，所以需要对新值进行观测
         * 在 !shallow 为真的情况下，即需要深度观测的时候才会执行
         */
        childOb = !shallow && observe(newVal);
        dep.notify();
      }
    });
  }

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__

  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */

export function del (target: Array<any> | Object, key: any) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
