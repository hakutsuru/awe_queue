<template>
<div class="wrapper">
  <header class="main-header">
    <nav class="navbar navbar-default navbar-fixed-top">
      <div class="container-fluid">
        <div class="navbar-header logo">
          <div class="pull-left image logo"><img src="/static/images/logo.png" alt="Logo" class="img-responsive img-logo"></div>
        </div>
        <div class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <li class="linkPage" @click="toggleActivePage"><router-link to="/send-message">Send Message</router-link></li>
            <li class="linkPage" @click="toggleActivePage"><router-link to="/receive-message">Receive Message</router-link></li>
            <li class="linkPage" @click="toggleActivePage"><router-link to="/delete-message">Delete Message</router-link></li>
            <li class="linkPage" @click="toggleActivePage"><router-link to="/get-stats">Queue Status</router-link></li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
  <div class="wrapper">
    <section class="content-main route-title">
      <h1>
        {{$route.name}} </h1>
        <h4>{{$route.meta.description}}</h4>
    </section>
    <router-view></router-view>
  </div>
</div>
</template>

<script>
export default {
  name: "AdminPanel",
  data() {
    return {
      user: {},
      stage: process.env.NODE_ENV
    };
  },
  mounted: function() {
    this.$el.querySelectorAll("li.linkPage").forEach(function(element) {
      element.classList.remove("active");
    });
    var path = window.location.pathname;
    var active = document.querySelectorAll("a[href='" + path + "']")[0];
    active.className = "router-link-active";
    active.parentElement.className = "linkPage active";
  },
  methods: {
    toggleActivePage(event) {
      this.$el.querySelectorAll("li.linkPage").forEach(function(element) {
        element.classList.remove("active");
      });
      event.toElement.parentElement.className = "linkPage active";
    }
  },
  created() {}
};
</script>

<style scoped>
.img-logo {
  margin-right: 16px;
  margin-top: 10px;
  height: 34px;
}
.route-title {
  text-align: center;
}
</style>
