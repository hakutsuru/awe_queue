<template>
  <div class="container">
    <h3>Check AweQ Stats</h3>
    <p>Placeholder for pontification of get-stats...</p>
    <p>Could be nice to configure checkout-lifetime and rescue-interval via site, but then it would be much less YAGNI...
    <div class="form-group">
     <button @click="sendMessage" class="btn btn-primary">Check Stats</button>
    </div>
    <div v-if="error" class="alert alert-danger">
      <p>{{ error }}</p>
    </div>
    <div v-if="message" class="alert alert-success">
      <pre>{{ message }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: "Help",
  data() {
    return {
      error: "",
      message: "",
      self: this
    };
  },
  methods: {
    sendMessage: function() {
      var query = "";
      var self = this;
      self.error = "";
      self.message = ""; 
      let url = process.env.STATS_ENDPOINT;
      self.$http.get(url).then(
        response => {
          //console.log("get-stats :: put-response ::", response);
          if (response.body.status === "okay") {
            self.message = `Stats for the Queue...\n${JSON.stringify(response.body, null, 4)}`;
          } else {
            self.error = response.body.message;
            if (response.body.error) {
              console.log("get-stats :: response-error ::", response.body.error);
            }
          }
        },
        error => {
          self.error = error.body.message;
          console.error("get-stats :: error ::", error);
        }
      );
    }
  }
};
</script>

<style scoped>
.container {
  width: 75%;
  min-width: 555px;
  max-width: 800px;
}

p{
  font-size: 16px;
}
</style>
