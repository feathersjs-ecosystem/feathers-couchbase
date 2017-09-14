const mkdirp = require('mkdirp');
const path = require('path');
function createArtistFolder(hook){
  var imageFolder = path.join(__dirname,'..','..','public','bilder', hook.data._id);
  return new Promise((resolve,reject)=>{
    mkdirp(imageFolder, (err)=>{
      if (err) {
        reject(err);
      }
      resolve(hook);
    });
  });
}


module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [createArtistFolder],
    update: [],
    patch: [],
    remove: []
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
