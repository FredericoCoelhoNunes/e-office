function resolveAfter2Seconds() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('resolved');
      }, 4000);
    });
  }

class Example {

    getVoice() {
        this.someString = resolveAfter2Seconds();
    }

    async sendVoice() {
        // Adding audio track to WebRTC connection.
        // Triggers the onnegotiationneeded event
        var someString = await this.someString;
        console.log(someString)
    }
}

example = new Example();
example.getVoice();
example.sendVoice();