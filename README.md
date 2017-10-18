# vue-set-get
ractive style set()/get() in vue

## installation

```bash
npm i -S vue-set-get
```

## usage

### without vuex
```javascript
import {set, get, plugin} from 'vue-set-get'
// or
const {set, get, plugin} = require('vue-set-get')

Vue.use(plugin) // will give you vm.$setDeep()/vm.$getDeep()

// .. somewhere in vm method
set(this.$data.obj, 'a.b.c.d', 'e')
// this will set vm.obj.a.b.c.d = 'e' and make new reactive object if some path is undefined
get(this.$data.obj, 'a.b.c.d', defaultValue)

// same as above if you installed plugin
this.$setDeep('a.b.c.d', 'e')
this.$getDeep('a.b.c.d', defaultValue)
```
Be aware that you can not do `set(vm, ...)` or `set(vm.$data, ...)` or you will get warned by Vue.

### vuex helper
```javascript
import {SET_STATE, vuexPlugin, vuexStoreMixin, linkVuexState} from 'vue-set-get'
// or
const {SET_STATE, vuexPlugin, vuexStoreMixin, linkVuexState} = require('vue-set-get')

// 1.
Vue.use(vuexPlugin)

// 2. add SET_STATE mutation in root store (not vuex module)
new Vuex.Store(_.extend({
  // ... your original store definition
}, vuexStoreMixin))
// or ..
new Vuex.Store(_.extend({
  state,
  actions,
  mutations: {
    SET_STATE,
    // ... your original mutations
  },
  actions,
  getters
}, vuexStoreMixin))

// 3.1. use `vm.vuexState()` in vue template
// which is installed by vuexPlugin above
// <span>{{vuexState('a.b.c.d')}}</span>

// 3.2. use `linkVuexState()` in v-model
// you must use it as computed prop since syntax like
// <input v-model="linkVuexState('a.b.c.d')">
// is unfortunately unsupported by Vue

// so write you template as
// <input v-model="linkStateABCD">
// and in component definition:
{
  data () {
    return {}
  },
  computed: {
    linkStateA: linkVuexState('a.b.c.d')
  }
  // ...
}
// now when input changed, `linkVuexState()` will commit `SET_STATE`
// to change the value of `$store.state.a.b.c.d`
```


# License
MIT
