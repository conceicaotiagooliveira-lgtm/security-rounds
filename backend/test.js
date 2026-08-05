const fetch = require('node-fetch');
async function test() {
  const res = await fetch('http://127.0.0.1:8000/terceiros/profiles');
  const data = await res.json();
  console.log(data.slice(0, 2));
}
test();
