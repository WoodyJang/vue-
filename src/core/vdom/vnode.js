/* @flow */

export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  fnScopeId: ?string; // functioanl scope id support

  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag                          //当前节点的标签名
    this.data = data                        //当前节点的数据对象        
    this.children = children                //数组类型，包含了当前节点的子节点
    this.text = text                        //当前节点的文本，一般文本节点或注释节点会有该属性
    this.elm = elm                          //当前虚拟节点对应的真实的dom节点
    this.ns = undefined                     //节点的namespace
    this.context = context                  //编译作用域
    this.fnContext = undefined              //函数化组件的作用域
    this.fnOptions = undefined              
    this.fnScopeId = undefined              
    this.key = data && data.key              //节点的key属性，用于作为节点的标识，有利于patch的优化
    this.componentOptions = componentOptions //创建组件实例时会用到的选项信息
    this.componentInstance = undefined
    this.parent = undefined                 //组件的占位节点
    this.raw = false                        //raw html
    this.isStatic = false                   //静态节点的标识
    this.isRootInsert = true                //是否作为根节点插入，被<transition>包裹的节点，该属性的值为false
    this.isComment = false                  //当前节点是否是注释节点
    this.isCloned = false                   //当前节点是否为克隆节点
    this.isOnce = false                     //当前节点是否有v-once指令
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child (): Component | void {
    return this.componentInstance
  }
}

export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}

export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
export function cloneVNode (vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.isCloned = true
  return cloned
}
