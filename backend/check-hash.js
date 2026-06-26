import bcrypt from "bcryptjs";

const hashes = [
  { name: "Rajesh Kumar", hash: "$2a$10$koPD0eQXj4wBrwxjmCJrP.LmQC9Y/XM51CC4fJAp08lDpO/0UyWZ2" },
  { name: "Dr. Amit Gupta", hash: "$2a$10$1q0rqmhVh6g1.iz2xMlp5.HtCNnooGuDZVXydEfdZ1pDfmte8U0ki" }
];

const guesses = ["password123", "admin123", "password", "123456", "medxpert", "test123", "doctor123", "patient123"];

for (const user of hashes) {
  console.log(`\nChecking ${user.name}...`);
  let found = false;
  for (const pw of guesses) {
    const match = await bcrypt.compare(pw, user.hash);
    if (match) {
      console.log(`  ✅ Password is: ${pw}`);
      found = true;
      break;
    }
  }
  if (!found) console.log("  ❌ No match found from common passwords.");
}
