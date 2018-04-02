<template>
<div>
  <router-view></router-view>
  <div id="admin-app">
  </div>
</div>
</template>

<script>
import sendMessage from "./components/SendMessage";

export default {
  name: "adminApp",
  components: {
    sendMessage
  }
};
</script>

<style>
#admin-app {
  margin-top: 40px;
  margin-left: 100px;
  margin-right: 100px;
}

body {
  padding: 50px;
}
</style>
