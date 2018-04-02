<template>
  <div class="container">
    <h3>Receive Messages from Queue</h3>
    <p>Placeholder for quips on receive-message for future project polishing.</p>
    <p>If no batch size chosen, default is to checkout single message from queue.</p>
    <div class="form-group">
        <label for="testing-content">Batch Size</label>
        <input type="text" class="form-control" v-model="batchSize" placeholder="Enter reasonable number or else..."/>
    </div>
    <div class="form-group">
     <button @click="sendMessage" class="btn btn-primary">Receive Messages</button>
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
      self: this,
      batchSize: null
    };
  },
  methods: {
    sendMessage: function() {
      var query = "";
      var self = this;
      self.error = "";
      self.message = ""; 
      if (self.batchSize) {
        self.batchSize = parseInt(self.batchSize, 10)
      }
      if (self.batchSize > 0 && self.batchSize <= 32) {
        query = `?count=${self.batchSize}`;
      }
      if (self.batchSize > 32) {
        self.error = "You were told to pick a reasonable batch size (.e.g. up to 32)...";
        return;
      }
      let url = `${process.env.RECEIVE_ENDPOINT}${query}`;
      //console.log("receive-message :: url ::", url);
      self.$http.get(url).then(
        response => {
          //console.log("receive-message :: put-response ::", response);
          if (response.body.status === "okay") {
            self.message = `Messages from the Queue...\n${JSON.stringify(response.body, null, 4)}`;
          } else {
            self.error = response.body.message;
            if (response.body.error) {
              console.log("receive-message :: response-error ::", response.body.error);
            }
          }
        },
        error => {
          self.error = error.body.message;
          console.error("receive-message :: error ::", error);
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
