import assignValue from 'lodash-es/_assignValue.js'
import castPath from 'lodash-es/_castPath.js'
import isIndex from 'lodash-es/_isIndex.js'
import isObject from 'lodash-es/isObject.js'
import toKey from 'lodash-es/_toKey.js'
import get from 'lodash-es/get.js'
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

    if (index != lastIndex) {
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

export {default as get} from 'lodash-es/get.js'

export const plugin = {
  install (Vue) {
    Vue.mixin({
      methods: {
        $getDeep (deepProps, defaultValue) {
          return get(this.$data, deepProps, defaultValue)
        },
        $setDeep (deepProps, value) {
          return set(this.$data, deepProps, value)
        },
      }
    })
  }
}


export const vuexPlugin = {
  install (Vue) {
    Vue.mixin({
      methods: {
        vuexState (deepProps, defaultValue) {
          return get(this.$store.state, deepProps, defaultValue)
        },
      }
    })
  }
}

export function SET_STATE (state, {keyPath, data}) {
  set(state, keyPath, data)
}

export const vuexStoreMixin = {
  mutations: {
    SET_STATE
  }
}


export function linkVuexState (keyPath, defaultValue) {
  return {
    get () {
      return this.vuexState(keyPath, defaultValue)
    },
    set (data) {
      this.$store.commit('SET_STATE', {
        keyPath,
        data
      })
    }
  }
}
