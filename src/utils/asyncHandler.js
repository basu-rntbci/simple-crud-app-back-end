// Without this wrapper every async route handler would need its own
// try/catch block to forward errors to Express's error handler:
//
//   app.get('/example', async (req, res, next) => {
//     try { ... } catch (err) { next(err); }
//   });
//
// asyncHandler does that forwarding automatically. It wraps the function,
// and if the returned Promise rejects, it calls next(err) so the global
// errorHandler middleware takes over. This keeps controllers clean.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
