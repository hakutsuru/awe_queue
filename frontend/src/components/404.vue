<template>
  <div class="container container-table not-found">
      <div class="row vertical-10p">
        <div class="container">
          <img src="/static/images/logo.png" class="center-block logo-img img-responsive center-">
          <div class="text-center col-sm-6 col-sm-offset-3">
            <h2>Page not found</h2>
            <h1>(╯°□°)╯︵ ┻━┻.</h1>
            <br>
            <h4>This page doesn't exist.</h4>
            <router-link to="/">Take me home.</router-link>
          </div>
        </div>
      </div>
  </div>
</template>

<script>
export default {
  name: "NotFound"
};
</script>

<style>
.not-found {
  padding: 40px;
}
</style>
