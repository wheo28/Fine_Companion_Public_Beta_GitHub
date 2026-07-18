class LS { constructor(){this.m={}} getItem(k){return k in this.m?this.m[k]:null} setItem(k,v){this.m[k]=String(v)} removeItem(k){delete this.m[k]} clear(){this.m={}} }
globalThis.window = globalThis.window || {}
const ls = new LS()
globalThis.localStorage = ls
globalThis.window.localStorage = ls
