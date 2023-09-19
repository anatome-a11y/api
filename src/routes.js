const express = require('express');
const routes = express.Router();

//PEÇA
const PecaService = require('./services/pecaService');
const pecasService = new PecaService()

routes.get('/peca', pecasService.findAll);
routes.post('/peca', pecasService.create);
routes.put('/peca/:id', pecasService.update);
routes.delete('/peca/:_id', pecasService.delete);

//ROTEIRO
const RoteiroService = require('./services/roteiroService');
const roteirosService = new RoteiroService()

routes.get('/roteiro', roteirosService.findall);
routes.post('/roteiro', roteirosService.create);
routes.put('/roteiro/:_id', roteirosService.update);
routes.delete('/roteiro/:_id', roteirosService.delete);

//AN@TOMP
const AnatompService = require('./services/anatompService');
const anatompService = new AnatompService()

routes.get('/anatomp', anatompService.findAll);
routes.post('/anatomp', anatompService.create);
routes.put('/anatomp/:id', anatompService.update);
routes.delete('/anatomp/:_id', anatompService.delete);

module.exports = routes;