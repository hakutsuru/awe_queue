import adminApp from "./adminApp";
import Resource from "vue-resource";
import routes from "./routes";
import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(Resource);
Vue.use(VueRouter);

var router = new VueRouter({
  routes: routes,
  mode: "history"
});

new Vue({
  el: "#app",
  router: router,
  template: "<admin-app/>",
  components: { adminApp }
});
