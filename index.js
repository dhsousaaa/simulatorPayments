require('dotenv').config()
const fs = require('fs');
const request = require('request');
const sha1 = require('sha1');
const urlRetorno = "https://dev.pjbank.com.br/subadquirente/api/retornos/put";
const urlProcessaRetorno = "https://dev.pjbank.com.br/subadquirente/api/publico/protectedliquidarretorno";


async function createFileForSandbox(params)
{
    if (!params.valor) throw "Valor é um parâmetro obrigátorio";

    if (!params.valor_pago) throw "Valor pago é um parâmetro obrigátorio";

    if (!params.vencimento) throw "Vencimento é um parâmetro obrigátorio";

    if (!params.dt_pagamento) throw "Data de pagamento é um parâmetro obrigátorio";

    if (!params.dt_credito) throw "Data de credito é um parâmetro obrigátorio";

    if (!params.vl_encargos) {
        var valorEncargos = '000000000000000';
    } else {
        var valorEncargos = formatarString(params.vl_encargos, 15 ,'0', true);
    }

    if (!params.id_unico) throw "Id unico é um parâmetro obrigátorio";
    var valorRetorno = formatarString(params.valor, 15 ,'0', true);
    var valorPago = formatarString(params.valor_pago, 15 ,'0', true);
    var valorVencimento = formatarString(params.vencimento, 8 ,'0', true);
    var valorIdUnico = formatarString(params.id_unico, 8 ,'0', true);
    var valorDtPagamento = formatarString(params.dt_pagamento, 8 ,'0', true);
    var valorDtCredito = formatarString(params.dt_credito, 8 ,'0', true);

    const headerOne = "03300000        2018191228000171111110130021071     006992587           CONTA GLOBAL DE RECEBIMENTO LTBANCO SANTANDER (BRASIL) S/A            209032015      000024040                                                                          \n";
    const headerTwo = "03397511T01  040 2018191228000171006992587           111110130021071     CONTA GLOBAL DE RECEBIMENTO LT                                                                                0000002409032015                                         \n";
    const segmentoT = "0339751300001T 06111110130021071        0000" + valorIdUnico +"01               " + valorVencimento + valorRetorno + "03344237                         002000000000000000                                        01300210720000000000001504800009000                      \n";
    const segmentoU = "0339751300002U 060000000000000000"+ valorEncargos +"00000000000000000000000000000"+ valorPago + valorPago +"000000000000000000000000000000"+ valorDtPagamento + valorDtCredito +"000000000000000000000000000                              000                           \n";
    const headerThree = "03397519         000001000210                                                                                                                                                                                                                   ";

    /* No exemplo abaixo, informamos o local que será criado o arquivo
    toda a informação que esse arquivo conterá, e por ultimo temos nossa função callback */
    fs.writeFile("./files/retorno.txt", headerOne + headerTwo + segmentoT + segmentoU + headerThree, function(err){
        //Caro ocorra algum erro
        if (err){
            throw err;
        }
        //Caso não tenha erro, retornaremos a mensagem de sucesso
        console.log('Arquivo Criado');
    });

}

function deleteFileForSandbox()
{
    try {
        fs.unlink("./files/retorno.txt", (err) => {
            if ( err) {
                throw err
            }
        });
    } catch (error) {
        console.log('Erro excluir arquivo: ' + err);
        throw error;
    }
}



function uploadFile()
{
    var formData = {
        nome_arquivo: "retorno.txt",
        pk_arquivo: sha1("retorno.txt" + "389054c742e95499187ccbdda38d527bc1f7fcdd543edb822d1"),
        ARQUIVO: fs.createReadStream("./files/" + "retorno.txt")
    };
    request.post({
        headers: {
            app_token: process.env.APP_TOKEN,
            access_token: process.env.ACCESS_TOKEN
        },
        url: urlRetorno,
        formData: formData
    }, function (err, httpResponse, body) {
        if (err) {
            console.log("erro no upload "+err)
            throw err;
        }
    });
}

function processarRetorno()
{
    setTimeout(function(){
        request(urlProcessaRetorno, function(err, response, bodyProcessaRetorno){
            if (err) {
                console.log("erro no upload "+err)
                throw err;
            }
        });
    }, 5000);
}

async function processarRetornoSandbox(dadosParaSimulacao)
{
    try {
        let file = await createFileForSandbox(dadosParaSimulacao);
        let upload = await uploadFile();
        let processarArquivo =  await processarRetorno();
        deleteFileForSandbox();

        return {
            "status": 200,
            "msg": "Simulacao de pagamento da cobranca " + dadosParaSimulacao.id_unico + " realizada com sucesso!!"
        }
    } catch (error) {
        console.log(error)
        return error
    }
}

/**
 *
 * @param {*} string string para ser formatada.
 * @param {*} quantidade quantidade de caracteres que a string deve ter.
 * @param {*} caracter para complementar a string
 * @param {*} left direção que vai ser colocada os caracteres para complementar a stirng.
 */
function formatarString(string, quantidade, caracter, left = false)
{
    let tamanhoString = string.length;
    let diffString = quantidade - tamanhoString;
    let stringAuxiliar = '';

    if (diffString === 0) {
        return string;
    } else {
        for (let i = 0; i < diffString; i++) {
            stringAuxiliar = stringAuxiliar + caracter;
        }
    }

    if (left) {
        return stringAuxiliar + string;
    } else {
        return string + stringAuxiliar;
    }
}

module.exports = {
    processarRetornoSandbox
}