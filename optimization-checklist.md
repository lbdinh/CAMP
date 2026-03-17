# Optimization Checklist

- [x] Localize runtime dependencies so the demos can run from `localhost` without internet
- [x] Replace CDN-driven `vision-demo-sim` runtime with vendored local assets
- [x] Remove remote font dependencies from the main entry pages
- [x] Add generated local CSS for the vision demo
- [x] Extract `vision-demo-sim` runtime code to [`vision-demo-sim/app.js`](/D:/GitCAMP/vision-demo-sim/app.js)
- [x] Extract `datahub-simulator` runtime code to [`datahub-simulator/app.js`](/D:/GitCAMP/datahub-simulator/app.js)
- [x] Add a local static server command with `npm run serve`
- [x] Rebuild after structural changes
- [ ] Add smoke tests for `localhost` routes
- [ ] Break `ctc-roi-calculator` into modules instead of one HTML file
- [ ] Add lint/test/typecheck gates
- [ ] Restore offline phone detection with a vendored local model
