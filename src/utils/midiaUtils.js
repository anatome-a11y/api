const withResumoMidias = r => {
  const tiposMidia = r.conteudos.map(c => {
      const arr = c.midias.map(m => m.type);
      return [].concat.apply([], arr)
  });
  const flat = [].concat.apply([], tiposMidia)

  const resumoMidias = flat.filter(function(item, pos) {
      return flat.indexOf(item) == pos;
  });
  
  return {...r, resumoMidias};
}

module.exports = withResumoMidias;