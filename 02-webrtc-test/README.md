# Description

Makes an audio call from one tab to the other using WebRTC. Useful to understand how to session negotiation process works between a caller and a receiver.

# Instructions

1. Install pip requirements
2. run `python signaling_server.py`
3. Open `receiver.html`
4. Open `caller.html`
5. Accept the  "Will you allow microphone" prompt, and if you are not using headphones, get ready to immediately close the tab because what will happen is:
  * the microphone will pick up the sound on the caller tab;
  * the receiver tab will play the sound on your computer's speakers;
  * this sound will be picked up by the computer's microphone;
  * the feedback loop will kill your ears
