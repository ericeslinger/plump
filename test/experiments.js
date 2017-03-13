const Rx = require('rxjs/Rx');
const pingers = [];
const ping = Rx.Observable.create((observer) => {
  pingers.push(observer);
});

function multiPong() {
  pingers.forEach((p) => p.next('pong'));
}

ping.subscribe((v) => console.log(v));
ping.subscribe((v) => console.log(v));
ping.subscribe((v) => console.log(v));

console.log('set up');
multiPong();
