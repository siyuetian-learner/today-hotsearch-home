const app = require("./app");

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`Today Hotsearch server running at http://127.0.0.1:${port}`);
});
