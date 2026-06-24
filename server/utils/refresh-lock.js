const { setNx } = require("./shared-store");

async function claimRefreshSlot(key, ttlSec) {
  return setNx(`refresh:${key}`, "1", ttlSec);
}

module.exports = {
  claimRefreshSlot,
};
