import errors from '@feathersjs/errors';

export default function errorHandler(error) {
  let feathersError = error;
  if (error.name) {
    switch (error.name) {
      case 'CouchError':{
        let MyError = (error.code === 404 || error.headers.status === 404) ? errors.NotFound : errors.GeneralError; 
        feathersError = new MyError(error, {
          ok: error.ok,
          code: error.code
        });
        break;
      }
    }
  }

  throw feathersError;
}
