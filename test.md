1 ) COMPROMISED DATABASE
- Strongly encrypt passwords with salt and hash (bcrypt)
- Strongly encrypt password reset tokens (SHA 256)

2 ) BRUTE FORCE ATTACKS
- Use bcrypt (to make login requests slow)
- Implement rate limiting (express-rate-limit)
- Implement maximum login attempts

3 ) CROSS-SITE SCRIPTING (XSS) ATTACKS
- Store JWT in HTTPOnly cookies
- Sanitize user input data
- Set special HTTP headers (helmet package)

4 ) DENIAL-OF-SERVICE (DOS) ATTACK
- Implement rate limiting (express-rate-limit) 
- Limit body payload (in body-parser)
- Avoid evil regular expressions

5 ) NOSQL QUERY INJECTION
- Use mongoose for MongoDB (because of SchemaTypes) 
- Sanitize user input data

6 ) OTHER BEST PRACTICES AND SUGGESTIONS
- Always use HTTPS
- Create random password reset tokens with expiry dates
- Deny access to JWT after password change
- Don’t commit sensitive config data to Git
- Don’t send error details to clients
- Prevent Cross-Site Request Forgery (csurf package) 
- Require re-authentication before a high-value action 
- Implement a blacklist of untrusted JWT
- Confirm user email address after first creating account 
- Keep user logged in with refresh tokens
- Implement two-factor authentication
- Prevent parameter pollution causing Uncaught Exceptions

