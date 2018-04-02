<template>
  <div class="container">
    <h3>Remove Message from Queue</h3>
    <p>Insightful notes are actually required to avoid confusion...</p>
    <p>tl;dr <strong>Do not use message-key returned by <em>send-message</em>, as it will not work.</strong> <em>delete-message</em> does not return an error if the key does not exist, since a message will be returned to the queue once its lifetime expires. Which is why queue consumers must track message keys to avoid duplicate processing.</p>
    <p>You cannot remove a message unless you have first consumed it via <em>receive-message</em>. To enable <em>at-least-once</em> delivery, messages are put back on the queue unless <em>acknowledged</em>, and to be strange, that acknowledgement is our <em>delete-message</em> -- since this indicates to the queue that you have processed the message, and it need not be persisted.</p>
    <p>Check <em>checkouts_count</em> before and after deleting a message -- and you should see its value decrease. The <em>checkouts</em> hash stores messages until acknowledged as processed (or the checkout expires). We remove messages via the <em>checkouts</em> hash.</p>
    <div class="form-group">
        <label for="testing-content">Message Key</label>
        <input type="text" class="form-control" v-model="messageKey" placeholder="hoarye-here-goes-your-garbleyuuid..."/>
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
      messageKey: null
    };
  },
  methods: {
    sendMessage: function() {
      var self = this;
      self.error = "";
      self.message = ""; 
      if (!self.messageKey) {
        self.error = "Message key is required to update queue!";
        return;
      }
      let url = process.env.DELETE_ENDPOINT.replace("{id}", self.messageKey);
      //sconsole.log("delete-message :: url ::", url);
      self.$http.delete(url).then(
        response => {
          //console.log("delete-message :: put-response ::", response);
          if (response.body.status === "okay") {
            self.message = `Message "${self.messageKey}" deleted...`;
          } else {
            self.error = response.body.message;
            if (response.body.error) {
              console.log("delete-message :: response-error ::", response.body.error);
            }
          }
        },
        error => {
          self.error = error.body.message;
          console.error("delete-message :: error ::", error);
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
