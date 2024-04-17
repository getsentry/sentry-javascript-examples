When running the event-proxy-server, the request are saved in a json file. This folder is where all
the generated files go.

## Notes

### Fastify

- v8: test-error does not include url

### Next.js

- v7: "transaction" is " " in sent event (when error happens)
- v8: 'route' is added to the name of the transaction. Eg. /test becomes /test/route
