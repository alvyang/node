import Vue from "vue/dist/vue.js";
import router from "router/router.js";
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-default/index.css'
Vue.use(ElementUI);

new Vue({
	el:"#app",
	template:"<router-view></router-view>",
	router,
});
