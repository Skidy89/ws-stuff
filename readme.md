# ws-stuff

scrapping apps just for fun!!
for now i have the auth, from now https://saucepan.ai/api/v1/users/me
gives the error json of "auth.missing_authorization", but if is a null/undefined token it just gives 401, this is weird, but ill handle both cases

since theres no ws (websocket) everything is handled by pools! (/api/v2/chat/generation/id/poll)
sends a status where u request the data (does also support streamed text!)


llm custom prompts are also supported, im working now on having a 1:1