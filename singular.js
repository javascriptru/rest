const Router = require('@koa/router');
const save = require('./save');

module.exports = (db, key, opts) => {
  const router = new Router();

  return router
    .get(get)
    .post(post, save(db)) // create
    .put(put, save(db)) // replace
    .patch(patch, save(db)) // update
    .routes();

  async function get(ctx, next) {
    ctx.body = db.get(key);
    await next();
  }

  async function post(ctx, next) {
    ctx.status = 409;
    ctx.body = { error: "Already exists, use PUT to replace" };
    await next();
  }

  // not well-tested
  async function put(ctx, next) {

    let validate = db.getValidate(key);

    if (!validate(ctx.request.body)) {
      ctx.body = {
        resource: ctx.request.body,
        errors: validate.errors
      };
      ctx.status = 400;
    } else {
      db.set(key, ctx.request.body);
      ctx.body = ctx.request.body;
    }
    await next();
  }
  
  // not well-tested
  async function patch(ctx, next) {
    let existingResource = db.getById(key, ctx.request.body.id);

    if (!existingResource) {
      ctx.throw(404);
    }

    let newResource = Object.assign(_.cloneDeep(existingResource), ctx.request.body);

    let validate = db.getValidate(key);

    if (!validate(newResource)) {
      ctx.body = {
        resource: newResource,
        errors: validate.errors
      };
      ctx.status = 400;
    } else {
      db.update(key, ctx.request.body);
      ctx.body = db.getById(key, ctx.request.body.id);
    }

    await next();
  }

};
