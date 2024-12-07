const bcrypt = require("bcrypt");

const storedHash =
  "$2b$10$K7s7OQx7F3f8yLSaqA0PA.tal2NfFsunS39./sXRqsvD3VpgtoTHS";
const passwordToCheck = "root@01";

bcrypt.compare(passwordToCheck, storedHash, (err, result) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Password match result:", result);
  }
});
