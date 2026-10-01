import { generateGitHubAppJwt } from "../../utility/jwt/jwt.js";

const token = generateGitHubAppJwt();

console.log("GitHub App JWT generated:", token);
console.log("JWT length:", token.length);