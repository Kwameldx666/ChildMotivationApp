OAuth redirect URIs (local development)

When registering OAuth redirect URIs in provider consoles (Google, Discord, GitHub) add the following local entries:

- http://localhost:8080/auth-service/google/callback
- http://localhost:8080/auth-service/github/callback
- http://localhost:8080/auth-service/discord/callback

If you run the browser outside of Docker and the app inside Docker you may also add:
- http://host.docker.internal:8080/auth-service/google/callback
- http://host.docker.internal:8080/auth-service/github/callback
- http://host.docker.internal:8080/auth-service/discord/callback

Also ensure the test user(s) (for Google) are added in the OAuth consent screen if the app is unverified.

.NET configuration

The project reads redirect URIs from environment variables. For local dev set them in `.env`:

AUTH_GOOGLE_REDIRECT_URI=http://localhost:8080/auth-service/google/callback
AUTH_GITHUB_REDIRECT_URI=http://localhost:8080/auth-service/github/callback
AUTH_DISCORD_REDIRECT_URI=http://localhost:8080/auth-service/discord/callback

And make sure docker-compose picks them up (the compose file uses these variables).