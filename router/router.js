import Vue from "vue/dist/vue.js";
import VueRouter from "vue-router";
Vue.use(VueRouter);

import Login from "views/login.vue";
import Main from "views/main.vue";

const router = new VueRouter({
	routes:[{
		path:"/",component:Login
	},{
		path:"/login",component:Login
	},{
		path:"/main",component:Main
	}]
});

export default router;