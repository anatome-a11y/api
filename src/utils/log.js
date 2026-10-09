const redigir = valor => String(valor == null ? '' : valor)
    .replace(/mongodb(\+srv)?:\/\/\S+/gi, 'mongodb://***');

const detalheDe = err => {
    if (!err) return '';
    if (typeof err === 'string') return redigir(err);
    const codigo = err.code ? ` (${err.code})` : '';
    return redigir((err.message || err.errmsg || err.name || 'erro') + codigo);
};

const registrarErro = (contexto, err, extra = {}) => {
    const erro = err instanceof Error ? err : null;
    const registro = {
        ...extra,
        nivel: 'error',
        em: new Date().toISOString(),
        contexto,
        mensagem: detalheDe(err),
        nome: erro && erro.name,
        codigo: err && err.code,
        stack: erro && erro.stack ? redigir(erro.stack).split('\n').slice(0, 8).join('\n') : undefined
    };
    console.error(JSON.stringify(registro));
};

const registrarInfo = (contexto, extra = {}) => {
    console.info(JSON.stringify({
        nivel: 'info',
        em: new Date().toISOString(),
        contexto,
        ...extra
    }));
};

const falha = (res, contexto, err, extra) => {
    registrarErro(contexto, err, extra);
    return res.status(500).send({ status: 500, error: detalheDe(err) || 'Erro interno' });
};

module.exports = { registrarErro, registrarInfo, falha, detalheDe };
