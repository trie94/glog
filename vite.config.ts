import { defineConfig } from 'vite'

export default defineConfig({
    base: '/glog/',
    build: {
        // indicate we are using ECMAScript Next. telling vite to not transpile our code into old javascript.
        // we need this because we are using web gpu.
        target: 'esnext'
    }
})