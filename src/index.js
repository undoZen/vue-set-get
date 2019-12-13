import castPath from 'lodash-es/_castPath.js'
import isIndex from 'lodash-es/_isIndex.js'
import isObject from 'lodash-es/isObject.js'
import toKey from 'lodash-es/_toKey.js'
import get from 'lodash-es/get.js'
import merge from 'lodash-es/merge.js'
import cloneDeep from 'lodash-es/cloneDeep.js'
import Vue from 'vue'

export function set(object, path, value) {
  if (!isObject(object)) {
    return object
  }
  path = castPath(path, object)

  var index = -1
  var length = path.length
  var lastIndex = length - 1
  var nested = object

  while (nested != null && ++index < length) {
    var key = toKey(path[index])

    if (index !== lastIndex) {
      var objValue = nested[key]
      if (objValue && isObject(objValue)) {
        if (!objValue.hasOwnProperty('__ob__')) {
          Vue.set(nested, key, objValue)
        }
      } else {
        Vue.set(nested, key, isIndex(path[index + 1]) ? [] : {})
      }
    } else {
      Vue.set(nested, key, value)
    }
    nested = nested[key]
  }
  return object
}

export { default as get } from 'lodash-es/get.js'

export const plugin = {
  install(Vue) {
    Vue.mixin({
      methods: {
        $getDeep(deepProps, defaultValue) {
          return get(this.$data, deepProps, defaultValue)
        },
        $setDeep(deepProps, value) {
          return set(this.$data, deepProps, value)
        },
      },
    })
  },
}

export const vuexPlugin = {
  install(Vue) {
    Vue.mixin({
      methods: {
        $setVuexState(keyPath, data) {
          this.$store.commit('SET_STATE', {
            keyPath,
            data,
          })
        },
        vuexState(deepProps, defaultValue) {
          return get(this.$store.state, deepProps, defaultValue)
        },
      },
    })
  },
}

export function SET_STATE(state, { keyPath, data }) {
  set(state, keyPath, data)
}

export const vuexStoreMixin = {
  mutations: {
    SET_STATE,
  },
}

export function isUndef(v) {
  return v === undefined || v === null
}

export function isPrimitive(value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}

export function linkVuexState(keyPath, defaultValue) {
  let breakLoopStore = null
  let breakLoopLocal = null
  return {
    get() {
      let got = this.vuexState(keyPath, defaultValue)
      if (
        got === defaultValue ||
        isUndef(got) ||
        isPrimitive(got) ||
        !hasOwn(got, '__ob__')
      ) {
        return got
      }
      let _localMirroredVuexState = this._localMirroredVuexState
      if (!_localMirroredVuexState) {
        this._localMirroredVuexState = Vue.observable({})
        _localMirroredVuexState = this._localMirroredVuexState
      }
      if (_localMirroredVuexState[keyPath]) {
        return _localMirroredVuexState[keyPath]
      }
      Vue.set(_localMirroredVuexState, keyPath, Vue.observable(cloneDeep(got)))
      this.$watch(
        () => this.vuexState(keyPath),
        val => {
          if (val && val.__ob__ && breakLoopLocal === val.__ob__.dep.id) {
            return
          }
          const nval = Vue.observable(cloneDeep(val))
          breakLoopStore = nval && nval.__ob__ && nval.__ob__.dep.id
          Vue.set(_localMirroredVuexState, keyPath, nval)
        },
        { deep: true }
      )
      this.$watch(
        () => _localMirroredVuexState[keyPath],
        val => {
          if (val && val.__ob__ && breakLoopStore === val.__ob__.dep.id) {
            return
          }
          const nval = Vue.observable(cloneDeep(val))
          breakLoopLocal = nval && nval.__ob__ && nval.__ob__.dep.id
          this.$store.commit('SET_STATE', {
            keyPath,
            data: nval,
          })
        },
        { deep: true }
      )
      return _localMirroredVuexState[keyPath]
    },
    set(data) {
      this.$store.commit('SET_STATE', {
        keyPath,
        data,
      })
    },
  }
}

const REGISTERED = 1
const HOT_UPDATED = 2

export const mixinStoreModule = (moduleName, moduleDefinition) => ({
  beforeCreate() {
    const $root = this.$root
    if (process.env.NODE_ENV !== 'development') {
      this.$store.registerModule(moduleName, moduleDefinition)
      return
    }
    if (!$root._storeModuleRegistered) {
      $root._storeModuleRegistered = {}
    }
    if ($root._storeModuleRegistered[moduleName]) {
      this.$store.hotUpdate({
        modules: {
          [moduleName]: moduleDefinition,
        },
      })
      $root._storeModuleRegistered[moduleName] = HOT_UPDATED
    } else {
      this.$store.registerModule(moduleName, moduleDefinition)
      $root._storeModuleRegistered[moduleName] = REGISTERED
    }
  },
  destroyed() {
    const $root = this.$root
    if (process.env.NODE_ENV !== 'development') {
      this.$store.unregisterModule(moduleName)
      return
    }
    if ($root._storeModuleRegistered[moduleName]) {
      if ($root._storeModuleRegistered[moduleName] === HOT_UPDATED) {
        $root._storeModuleRegistered[moduleName] = REGISTERED
      } else {
        this.$store.unregisterModule(moduleName)
        delete $root._storeModuleRegistered[moduleName]
      }
    }
  },
})

export const extendState = (proto, overwrite) => {
  const owIsFunc = typeof overwrite === 'function'
  const ptIsFunc = typeof proto === 'function'
  const getState = () => {
    const protoObj = ptIsFunc ? proto() : proto
    const overwriteObj = owIsFunc ? overwrite(protoObj) : overwrite
    return merge({}, protoObj, overwriteObj)
  }
  return ptIsFunc || owIsFunc ? getState : getState()
}

export const extendModule = (proto, overwrite) =>
  merge({}, proto, overwrite, {
    state: extendState(proto.state, overwrite.state),
  })
