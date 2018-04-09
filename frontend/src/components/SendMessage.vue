<template>
  <div class="container">
    <h3>Post Message to AweQ</h3>
    <p>Insightful notes on send-message belong here, but time&rsquo;s wing&eacute;d chariot is at our heels.</p>
    <div class="form-group">
        <label for="testing-content">Queue Message</label>
        <input type="text" class="form-control" v-model="queueMessage" placeholder="Your deepest thoughts are welcome..."/>
    </div>
    <div class="form-group">
     <button @click="sendMessage" class="btn btn-primary">Send Message</button>
    </div>
    <div v-if="error" class="alert alert-danger">
      <p>{{ error }}</p>
    </div>
    <div v-if="message" class="alert alert-success">
      <p>{{ message }}</p>
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
      self: this,
      queueMessage: null
    };
  },
  methods: {
    sendMessage: function() {
      var self = this;
      self.error = "";
      self.message = ""; 
      if (!self.queueMessage) {
        self.error = "Message content is required to update queue!";
        return;
      }
      let url = process.env.SEND_ENDPOINT;
      var message = JSON.stringify({ "message": this.queueMessage });
      self.$http.post(url, message).then(
        response => {
          //console.log("send-message :: put-response ::", response);
          if (response.body.status === "okay") {
            self.message = `Message "${response.body.key}" posted to queue...`;
          } else {
            self.error = response.body.message;
            if (response.body.error) {
              console.log("send-message :: response-error ::", response.body.error);
            }
          }
        },
        error => {
          self.error = error.body.message;
          console.error("send-message :: error ::", error);
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
