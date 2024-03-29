require('./library/mongo-init')();
require('dotenv').config();
const CryptoJS = require("crypto-js");
const Encryption = require('./library/encryption');
const moment = require('moment-timezone');
const helper = require('./library/helper')
const logging = require('./library/logging-helper')
const sch = require('node-schedule');
const modelRekonResult = require('./models/rekon-result');
const modelRekon = require('./models/rekon');
const modelTransaksiBuff = require('./models/transaksi-buff');
const modelTransaksiDetail = require('./models/transaksi-detail');
const sender = require('./controller/sender');

let isProses = false;

sch.scheduleJob('*/1 * * * *', async function(){    
    console.log(`${helper.getDateTimeNow()} Cron Job v1.1 Running...`);    

    /* Proses Rekon Manual */
    let dataRekon = await modelRekonResult.findOne({is_proses : "pending"});
    // let dataRekon = await modelRekonResult.findOne({id_rekon : 496});
    
    if(dataRekon !== null) {
        if(!isProses){
            // update rekon sedang di proses
            isProses = true;
            const filter = { id_rekon: dataRekon.id_rekon, id_rekon_result : dataRekon.id_rekon_result};
            const update = { is_proses: "proses" };
            await modelRekonResult.findOneAndUpdate(filter, update);

            if(dataRekon.is_rekon_transaksi == 1) {
                await processDataTransaksi(dataRekon.id_rekon, dataRekon.id_channel, dataRekon.id_rekon_result, dataRekon.id_collection);
            } else {
                await processData(dataRekon.id_rekon, dataRekon.id_channel, dataRekon.id_rekon_result);
            }

            
        }
    } else {
        logging.info("", `no rekon pending found`);
    }


    /* Proses Rekon Schedule/Otomatis */
    const dataRekonSch = await modelRekon.find({'is_schedule' : 1});
    if(dataRekonSch !== null) {
        for (const rowData of dataRekonSch) {

            const timeNow = moment().format('HH:mm');
            if(rowData.detail_schedule.waktu_rekon == timeNow) {
                logging.info("", `Rekon Schedule Found!`);
                const key = process.env.ECRYPTION_KEY;
                const libEncrypt = new Encryption();
                const encryptedData = libEncrypt.encrypt(JSON.stringify({"id_rekon" : rowData.id_rekon}), key);
                
                const prosesData = await sender.sendPost({'encryptedData' : encryptedData});  
                               
                if(prosesData.response_code == "00") {
                    dataRekon = prosesData.response_data;   
                    const filter = { id_rekon: dataRekon.id_rekon, id_rekon_result : dataRekon.id_rekon_result};
                    const update = { is_proses: "proses" };
                    await modelRekonResult.findOneAndUpdate(filter, update);
                    await processData(dataRekon.id_rekon, dataRekon.id_channel, dataRekon.id_rekon_result);
                }
            }
                
                
            // }

        }
        
    }
});

async function processDataTransaksi(idRekon, idChannel, idRekonResult, idCollection) {
    logging.info(idRekon, `== PROSES REKON TRANSAKSI==`);

    const modelRekon = require('./models/rekon');
    const modelRekonDetail = require('./models/rekon-detail');
    const modelTransaksiBuff = require('./models/transaksi-buff');
    
    const dataRekonTransaksi = await modelTransaksiBuff.findOne({id_collection : idCollection});
    const dataRekon = await modelRekon.find({id_rekon : idRekon});

    const dataTransaksi = await modelTransaksiDetail.find({id_collection : idCollection}).limit(0);
    const dataRekon2 = await modelRekonDetail.find({id_rekon : idRekon, tipe : '2'}).limit(0);

    const dataRekonSatu = await processDataTransaksiSatu(dataRekon, dataRekonTransaksi, dataTransaksi, dataRekon2, idRekonResult, idChannel, idRekon);
    const dataRekonDua = await processDataTransaksiDua(dataRekon, dataRekonTransaksi, dataTransaksi, dataRekon2, idRekonResult, idChannel, idRekon);

    // update rekon result
    const filterRekonResult = { id_rekon: dataRekon[0].id_rekon, id_rekon_result : idRekonResult};
    const updateRekonResult = { 
        is_proses: "sukses", 
        timestamp_complete: helper.getDateTimeNow(), 
        data_result1 : dataRekonSatu,
        data_result2 : dataRekonDua
    };
    const modelRekonResult = require('./models/rekon-result');
    await modelRekonResult.findOneAndUpdate(filterRekonResult, updateRekonResult);

    logging.info(idRekon, `== DONE PROSES REKON TRANSAKSI==`);
    isProses = false;

}

async function processData(idRekon, idChannel, idRekonResult) {
    logging.info(idRekon, `== PROSES REKON ==`);

    const modelRekon = require('./models/rekon');
    const modelRekonDetail = require('./models/rekon-detail');
    // const modelRekonResult = require('./models/rekon-result');

    const dataRekon = await modelRekon.find({id_rekon : idRekon});
    const dataRekon1 = await modelRekonDetail.find({id_rekon : idRekon, tipe : '1'}).limit(0);
    const dataRekon2 = await modelRekonDetail.find({id_rekon : idRekon, tipe : '2'}).limit(0);

    // await modelRekonResult.deleteMany({ id_rekon: dataRekon[0].id_rekon});
    // const idRekonResult = modelRekonDetail->;

    const dataRekonSatu = await processDataSatu(dataRekon, dataRekon1, dataRekon2, idRekonResult, idChannel, idRekon)
    const dataRekonDua = await processDataDua(dataRekon, dataRekon1, dataRekon2, idRekonResult, idChannel, idRekon)

    // update rekon result
    const filterRekonResult = { id_rekon: dataRekon[0].id_rekon, id_rekon_result : idRekonResult};
    const updateRekonResult = { 
        is_proses: "sukses", 
        timestamp_complete: helper.getDateTimeNow(), 
        data_result1 : dataRekonSatu,
        data_result2 : dataRekonDua
    };
    const modelRekonResult = require('./models/rekon-result');
    await modelRekonResult.findOneAndUpdate(filterRekonResult, updateRekonResult);

    logging.info(idRekon, `== DONE PROSES REKON ==`);
    isProses = false;

    // const filter = { id_rekon: dataRekon[0].id_rekon };
    // const update = { is_proses: "sukses", timestamp_complete: helper.getDateTimeNow()};
    // await modelRekon.findOneAndUpdate(filter, update);
}


async function processDataSatu(dataRekon, dataRekon1, dataRekon2, idRekonResult, idChannel, idRekon) {
    logging.info(idRekon, `PROSES REKON SATU [${idRekonResult}]`);
    const dataCompareArra = dataRekon[0].kolom_compare;
    const dataSumArra = dataRekon[0].kolom_sum;
    const dataArray1 = [];
    let total_sum = 0;
    let total_sum_match = 0;
    let total_sum_unmatch = 0;
    const unMatch = [];
    const match = [];

    for (const [index, value] of dataRekon1.entries()) { 
        dataArray1.push(value.data_row)
    }
    const dataArray2 = [];
    for (const [index, value] of dataRekon2.entries()) { 
        dataArray2.push(value.data_row)
    }

    logging.info(idRekon, `TOTAL DATA = ${dataArray1.length}`);
    logging.info(idRekon, `PROGESS COMPARING DATA [${idRekonResult}]`);
    for (const row1 of dataArray1) {
        // process.stdout.write('Processing index ' + indexRow + ' complete... \r');
        let isCocok = false;
        for (const [indexRow2, row2] of dataArray2.entries()) {
            for (const [indexCompare, valCompare] of dataCompareArra.entries()) { 
                if(valCompare.tipe != 1) continue;
                // console.log(valCompare);
                const dataSatu = row1[valCompare.kolom_index];
                const dataDua = row2[valCompare.to_compare_index];
                // console.log(valCompare.rule + " - " + dataSatu + "=" +dataDua)
                if(valCompare.rule == "equal") {
                    if(dataSatu == dataDua) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "contain") {
                    const containVal = valCompare.rule_value;
                    // if(dataDua.includes(containVal) && dataSatu.includes(containVal)) isCocok = true;
                    if(dataDua.includes(dataSatu)) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "begin") {
                    const beginVal = valCompare.rule_value;
                    // if(dataDua.startsWith(beginVal) && dataSatu.startsWith(beginVal)) isCocok = true;
                    if(dataDua.startsWith(dataSatu)) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "end") {
                    const endVal = valCompare.rule_value;
                    // if(dataDua.endsWith(endVal) && dataSatu.endsWith(endVal)) isCocok = true;
                    if(dataDua.endsWith(dataSatu)) isCocok = true;
                    else isCocok = false;break;
                }                
            }
            
            if(isCocok) {
                /* Remove from array to prevent doubles */
                dataArray2.splice(indexRow2, 1);

                /* sum match */
                for(const [index, rowSum] of dataSumArra.entries()) {
                    if(rowSum.tipe != 1) continue;
                    const indexKolom = parseInt(dataSumArra[index].kolom_index);
                    total_sum_match = total_sum_match + (parseInt(row1[indexKolom]) || 0)
                }

                match.push(
                    {
                        tipe : "1",
                        id_rekon : dataRekon[0].id_rekon,
                        id_rekon_result : idRekonResult,
                        row_data : row1
                    })

                break;
            } 
        }
        if(!isCocok) {

            /* sum unmatch */
            for(const [index, rowSum] of dataSumArra.entries()) {
                if(rowSum.tipe != 1) continue;
                const indexKolom = parseInt(dataSumArra[index].kolom_index);
                total_sum_unmatch = (parseInt(total_sum_unmatch) || 0) + (parseInt(row1[indexKolom]) || 0)
            }
            unMatch.push(
                {
                    tipe : "1",
                    id_rekon : dataRekon[0].id_rekon,
                    id_rekon_result : idRekonResult,
                    row_data : row1,
                })
        }
    }

    
    /* sum all and save */
    for (const row1 of dataArray1) {
        for(const [index, rowSum] of dataSumArra.entries()) {
            if(rowSum.tipe != 1) continue;
            const indexKolom = parseInt(dataSumArra[index].kolom_index);
            total_sum = total_sum + (parseInt(row1[indexKolom]) || 0)
        }
    }

    const totalUnmatch = unMatch.length;
    // console.log("===DATA 1 ===")
    // console.log("TOTAL DATA = " + (dataArray1.length));
    // console.log("TOTAL DATA MATCH = " + (dataArray1.length - totalUnmatch));
    // console.log("TOTAL DATA UNMATCH = " +totalUnmatch);
    // logging.info(idRekon, `"TOTAL DATA MATCH = " + (${dataArray1.length - totalUnmatch})`);
    // logging.info(idRekon, `"TOTAL DATA UNMATCH = " + (${totalUnmatch})`);

    const dataSumArraSatu = [];
    // console.log("=> SUMMERIZE DATA ");
    for(const [index, rowSum] of dataSumArra.entries()) {
        if(rowSum.tipe != 1) continue;
        dataSumArraSatu.push(rowSum); 
    }

    /* Perhitungan Fee */
    const channel = require('./models/channel');
    const dataChannel = await channel.find({_id : idChannel});

    const totalMatchData = (dataArray1.length - totalUnmatch);

    const dataRekonResult = {
        tipe : 1,
        id_rekon: dataRekon[0].id_rekon,
        id_rekon_result : idRekonResult,
        nama_rekon: dataRekon[0].nama_rekon,
        sum_result : {
            total_sum: (parseInt(total_sum) || 0),
            total_sum_match: total_sum_match,
            total_sum_unmatch: (parseInt(total_sum_unmatch) || 0)
        },
        compare_result : {
            total_data: dataArray1.length,
            total_match: (dataArray1.length - totalUnmatch),
            total_unmatch: totalUnmatch
        },
        id_channel : idChannel,
        fee_detail : {
            fee1 : {
                nilai : dataChannel[0].fee1.nilai,
                total : generateFee(dataChannel[0].fee1, totalMatchData, total_sum_match)
            },
            fee2 : {
                nilai : dataChannel[0].fee2.nilai,
                total : generateFee(dataChannel[0].fee2, totalMatchData, total_sum_match)
            },
            fee3 : {
                nilai : dataChannel[0].fee3.nilai,
                total : generateFee(dataChannel[0].fee3, totalMatchData, total_sum_match)
            },
            fee4 : {
                nilai : dataChannel[0].fee4.nilai,
                total : generateFee(dataChannel[0].fee4, totalMatchData, total_sum_match)
            },
            fee5 : {
                nilai : dataChannel[0].fee5.nilai,
                total : generateFee(dataChannel[0].fee5, totalMatchData, total_sum_match)
            },
            fee_admin : {
                nilai : dataChannel[0].fee_admin.nilai,
                total : generateFee(dataChannel[0].fee_admin, totalMatchData, total_sum_match)
            },
            fee_company : {
                nilai : 0,
                total : 0
            }
        }        
    }

    // const modelRekonResult = require('./models/rekon-result');
    // await modelRekonResult.create(dataRekonResult);

    const modelRekonUnmatch = require('./models/rekon-unmatch');
    modelRekonUnmatch.insertMany(unMatch);

    const modelRekonMatch = require('./models/rekon-match');
    modelRekonMatch.insertMany(match);

    return dataRekonResult;

}

async function processDataDua(dataRekon, dataRekon1, dataRekon2, idRekonResult, idChannel, idRekon) {
    logging.info(idRekon, `PROSES REKON DUA [${idRekonResult}]`);
    const dataCompareArra = dataRekon[0].kolom_compare;
    const dataSumArra = dataRekon[0].kolom_sum;
    const dataArray1 = [];    
    let total_sum = 0;
    let total_sum_match = 0;
    let total_sum_unmatch = 0;
    const unMatch = [];
    const match = [];

    for (const [index, value] of dataRekon1.entries()) { 
        dataArray1.push(value.data_row)
    }
    const dataArray2 = [];
    for (const [index, value] of dataRekon2.entries()) { 
        dataArray2.push(value.data_row)
    }

    logging.info(idRekon, `TOTAL DATA = ${dataArray2.length}`);    
    logging.info(idRekon, `PROGESS COMPARING DATA 2 [${idRekonResult}]`);
    for (const row2 of dataArray2) {
        let isCocok = false;
        for (const [indexRow1,row1] of dataArray1.entries()) {
            for (const [indexCompare, valCompare] of dataCompareArra.entries()) { 
                if(valCompare.tipe != 2) continue;

                const dataSatu = row1[valCompare.to_compare_index];
                const dataDua = row2[valCompare.kolom_index];
                // console.log(valCompare.rule + " - " + dataSatu + "=" +dataDua)
                if(valCompare.rule == "equal") {
                    if(dataSatu == dataDua) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "contain") {
                    const containVal = valCompare.rule_value;
                    // if(dataDua.includes(containVal) && dataSatu.includes(containVal)) isCocok = true;
                    if(dataSatu.includes(dataDua)) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "begin") {
                    const beginVal = valCompare.rule_value;
                    // if(dataDua.startsWith(beginVal) && dataSatu.startsWith(beginVal)) isCocok = true;
                    if(dataSatu.startsWith(dataDua)) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "end") {
                    const endVal = valCompare.rule_value;
                    // if(dataDua.endsWith(endVal) && dataSatu.endsWith(endVal)) isCocok = true;
                    if(dataSatu.endsWith(dataDua)) isCocok = true;
                    else isCocok = false;break;
                }              
                
            }
            
            if(isCocok) {
                /* Remove from array to prevent doubles */
                dataArray1.splice(indexRow1, 1);

                /* sum match */
                for(const [index, rowSum] of dataSumArra.entries()) {
                    if(rowSum.tipe != 2) continue;
                    const indexKolom = parseInt(dataSumArra[index].kolom_index);
                    total_sum_match = total_sum_match + (parseInt(row2[indexKolom]) || 0)              
                }

                match.push(
                    {
                        tipe : "2",
                        id_rekon : dataRekon[0].id_rekon,
                        id_rekon_result : idRekonResult,
                        row_data : row2
                    })
                break;
            }
        }
        if(!isCocok) {

            /* sum unmatch */
            for(const [index, rowSum] of dataSumArra.entries()) {
                if(rowSum.tipe != 2) continue;
                const indexKolom = parseInt(dataSumArra[index].kolom_index);
                total_sum_unmatch = (parseInt(total_sum_unmatch) || 0) + (parseInt(row2[indexKolom]) || 0)           
            }
            
            unMatch.push(
                {
                    tipe : "2",
                    id_rekon : dataRekon[0].id_rekon,
                    id_rekon_result : idRekonResult,
                    row_data : row2
                })
        }
    }

    
    /* sum all and save */
    for (const row2 of dataArray2) {
        for(const [index, rowSum] of dataSumArra.entries()) {
            if(rowSum.tipe != 2) continue;
            const indexKolom = parseInt(dataSumArra[index].kolom_index);
            total_sum = total_sum + (parseInt(row2[indexKolom]) || 0)            
        }
    }

    const totalUnmatch = unMatch.length;
    // console.log("===DATA 2 ===")
    // console.log("TOTAL DATA = " + (dataArray2.length));
    // console.log("TOTAL DATA MATCH = " + (dataArray2.length - totalUnmatch));
    // console.log("TOTAL DATA UNMATCH = " + totalUnmatch);
    // logging.info(idRekon, `"TOTAL DATA MATCH = " + (${dataArray2.length - totalUnmatch})`);
    // logging.info(idRekon, `"TOTAL DATA UNMATCH = " + (${totalUnmatch})`);

    const dataSumArraDua = [];
    // console.log("=> SUMMERIZE DATA ");
    for(const [index, rowSum] of dataSumArra.entries()) {
        if(rowSum.tipe != 2) continue;
        dataSumArraDua.push(rowSum);
    }

    /* Perhitungan Fee */
    const channel = require('./models/channel');
    const dataChannel = await channel.find({_id : idChannel});

    const totalMatchData = (dataArray2.length - totalUnmatch);

    const dataRekonResult = {
        tipe : 2,
        id_rekon: dataRekon[0].id_rekon,
        id_rekon_result : idRekonResult,
        nama_rekon: dataRekon[0].nama_rekon,
        sum_result : {
            total_sum: (parseInt(total_sum) || 0),
            total_sum_match: total_sum_match,
            total_sum_unmatch: (parseInt(total_sum_unmatch) || 0)
        },
        compare_result : {
            total_data: dataArray2.length,
            total_match: (dataArray2.length - totalUnmatch),
            total_unmatch: totalUnmatch
        },
        id_channel : idChannel,
        fee_detail : {
            fee1 : {
                nilai : dataChannel[0].fee1.nilai,
                total : generateFee(dataChannel[0].fee1, totalMatchData, total_sum_match)
            },
            fee2 : {
                nilai : dataChannel[0].fee2.nilai,
                total : generateFee(dataChannel[0].fee2, totalMatchData, total_sum_match)
            },
            fee3 : {
                nilai : dataChannel[0].fee3.nilai,
                total : generateFee(dataChannel[0].fee3, totalMatchData, total_sum_match)
            },
            fee4 : {
                nilai : dataChannel[0].fee4.nilai,
                total : generateFee(dataChannel[0].fee4, totalMatchData, total_sum_match)
            },
            fee5 : {
                nilai : dataChannel[0].fee5.nilai,
                total : generateFee(dataChannel[0].fee5, totalMatchData, total_sum_match)
            },
            fee_admin : {
                nilai : dataChannel[0].fee_admin.nilai,
                total : generateFee(dataChannel[0].fee_admin, totalMatchData, total_sum_match)
            },
            fee_company : {
                nilai : 0,
                total : 0
            }
        }     
    }

    // const modelRekonResult = require('./models/rekon-result');
    // await modelRekonResult.create(dataRekonResult);

    const modelRekonUnmatch = require('./models/rekon-unmatch');
    modelRekonUnmatch.insertMany(unMatch);

    const modelRekonMatch = require('./models/rekon-match');
    modelRekonMatch.insertMany(match);

    return dataRekonResult;
    
}

async function processDataTransaksiDua(dataRekon, dataRekonTransaksi, dataTransaksi, dataRekon2, idRekonResult, idChannel, idRekon) {
    logging.info(idRekon, `PROSES REKON TRANSAKSI [${idRekonResult}]`);
    const dataCompareArra = dataRekon[0].kolom_compare;
    const dataSumArra = dataRekon[0].kolom_sum;
    
    const dataArray1 = dataTransaksi;    
    let total_sum = 0;
    let total_sum_match = 0;
    let total_sum_unmatch = 0;
    
    const unMatch = [];
    const match = [];

    const dataArray2 = [];
    for (const [index, value] of dataRekon2.entries()) { 
        dataArray2.push(value.data_row)
    }

    logging.info(idRekon, `TOTAL DATA REKON = ${dataArray2.length}`);   
    logging.info(idRekon, `TOTAL DATA TRANSAKSI = ${dataArray1.length}`);    
    logging.info(idRekon, `PROGESS COMPARING DATA [${idRekonResult}]`);
    for (const row2 of dataArray2) {
        let isCocok = false;
        for (const [indexRow1,row1] of dataArray1.entries()) {
            for (const [indexCompare, valCompare] of dataCompareArra.entries()) {

                /* skip jika ada yg found */
                if(row1.is_found == false) {
                    continue;
                }

                const dataTransaksi = row1.data_row[valCompare.to_compare_index];
                const dataDua = row2[valCompare.kolom_index];
                
                if(valCompare.rule == "equal") {
                    if(dataTransaksi == dataDua) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "contain") {
                    const containVal = valCompare.rule_value;
                    if(dataTransaksi.includes(dataDua)) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "begin") {
                    const beginVal = valCompare.rule_value;
                    if(dataTransaksi.startsWith(dataDua)) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "end") {
                    const endVal = valCompare.rule_value;
                    if(dataTransaksi.endsWith(dataDua)) isCocok = true;
                    else isCocok = false;break;
                }              
                
            }
            
            if(isCocok) {                
                
                /* Remove from array to prevent doubles */
                dataArray1.splice(indexRow1, 1);

                /* sum match */
                for(const [index, rowSum] of dataSumArra.entries()) {
                    const indexKolom = parseInt(dataSumArra[index].kolom_index);
                    total_sum_match = total_sum_match + (parseInt(row2[indexKolom]) || 0)              
                }

                match.push(
                    {
                        tipe : "2",
                        id_rekon : idRekon,
                        id_rekon_result : idRekonResult,
                        row_data : row2,
                    });

                /* Remove from array to prevent doubles */
                dataArray1.splice(indexRow1, 1);
                break;
            }
        }
        if(!isCocok) {

            /* sum unmatch */
            for(const [index, rowSum] of dataSumArra.entries()) {
                if(rowSum.tipe != 2) continue;
                const indexKolom = parseInt(dataSumArra[index].kolom_index);
                total_sum_unmatch = (parseInt(total_sum_unmatch) || 0) + (parseInt(row2[indexKolom]) || 0)           
            }
            
            unMatch.push(
                {
                    tipe : "2",
                    id_rekon : dataRekon[0].id_rekon,
                    id_rekon_result : idRekonResult,
                    row_data : row2
                });
        }
    }

    
    /* sum all and save */
    for (const row2 of dataArray2) {
        for(const [index, rowSum] of dataSumArra.entries()) {
            const indexKolom = parseInt(dataSumArra[index].kolom_index);
            total_sum = total_sum + (parseInt(row2[indexKolom]) || 0)            
        }
    }

    const totalUnmatch = unMatch.length;
    const dataSumArraDua = [];
    
    for(const [index, rowSum] of dataSumArra.entries()) {
        if(rowSum.tipe != 2) continue;
        dataSumArraDua.push(rowSum);
    }

    /* Perhitungan Fee */
    const channel = require('./models/channel');
    const dataChannel = await channel.find({_id : idChannel});

    const totalMatchData = (dataArray2.length - totalUnmatch);

    const dataRekonResult = {
        tipe : 2,
        id_rekon: dataRekon[0].id_rekon,
        id_rekon_result : idRekonResult,
        nama_rekon: dataRekon[0].nama_rekon,
        sum_result : {
            total_sum: (parseInt(total_sum) || 0),
            total_sum_match: total_sum_match,
            total_sum_unmatch: (parseInt(total_sum_unmatch) || 0)
        },
        compare_result : {
            total_data: dataArray2.length,
            total_match: (dataArray2.length - totalUnmatch),
            total_unmatch: totalUnmatch
        },
        id_channel : idChannel,
        fee_detail : {
            fee1 : {
                nilai : dataChannel[0].fee1.nilai,
                total : generateFee(dataChannel[0].fee1, totalMatchData, total_sum_match)
            },
            fee2 : {
                nilai : dataChannel[0].fee2.nilai,
                total : generateFee(dataChannel[0].fee2, totalMatchData, total_sum_match)
            },
            fee3 : {
                nilai : dataChannel[0].fee3.nilai,
                total : generateFee(dataChannel[0].fee3, totalMatchData, total_sum_match)
            },
            fee4 : {
                nilai : dataChannel[0].fee4.nilai,
                total : generateFee(dataChannel[0].fee4, totalMatchData, total_sum_match)
            },
            fee5 : {
                nilai : dataChannel[0].fee5.nilai,
                total : generateFee(dataChannel[0].fee5, totalMatchData, total_sum_match)
            },
            fee_admin : {
                nilai : dataChannel[0].fee_admin.nilai,
                total : generateFee(dataChannel[0].fee_admin, totalMatchData, total_sum_match)
            },
            fee_company : {
                nilai : 0,
                total : 0
            }
        }     
    }

    const modelRekonUnmatch = require('./models/rekon-unmatch');
    modelRekonUnmatch.insertMany(unMatch);

    const modelRekonMatch = require('./models/rekon-match');
    modelRekonMatch.insertMany(match);

    return dataRekonResult;
    
}

async function processDataTransaksiSatu(dataRekon, dataRekonTransaksi, dataTransaksi, dataRekon2, idRekonResult, idChannel, idRekon) {
    logging.info(idRekon, `PROSES REKON SATU [${idRekonResult}]`);
    const dataCompareArra = dataRekonTransaksi.kolom_compare;
    const dataSumArra = dataRekonTransaksi.kolom_sum;
    const dataArray1 = dataTransaksi;
    let total_sum = 0;
    let total_sum_match = 0;
    let total_sum_unmatch = 0;
    const unMatch = [];
    const match = [];
    
    const dataArray2 = [];
    for (const [index, value] of dataRekon2.entries()) { 
        dataArray2.push(value.data_row)
    }

    logging.info(idRekon, `TOTAL DATA = ${dataArray1.length}`);
    logging.info(idRekon, `PROGESS COMPARING DATA [${idRekonResult}]`);
    for (const row1 of dataArray1) {
        
        let isCocok = false;
        for (const [indexRow2, row2] of dataArray2.entries()) {
            // console.log(row2);
            for (const [indexCompare, valCompare] of dataCompareArra.entries()) { 
                const dataSatu = row1.data_row[valCompare.kolom_index];
                const dataDua = row2[valCompare.to_compare_index];
                
                if(valCompare.rule == "equal") {
                    if(dataSatu == dataDua) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "contain") {
                    const containVal = valCompare.rule_value;
                    if(dataDua.includes(dataSatu)) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "begin") {
                    const beginVal = valCompare.rule_value;
                    if(dataDua.startsWith(dataSatu)) isCocok = true;
                    else isCocok = false;break;
                } else if(valCompare.rule == "end") {
                    const endVal = valCompare.rule_value;
                    if(dataDua.endsWith(dataSatu)) isCocok = true;
                    else isCocok = false;break;
                }                
            }
            
            if(isCocok) {
                /* Remove from array to prevent doubles */
                dataArray2.splice(indexRow2, 1);

                 /* FLAG IS FOUND */
                const filterRekonResult = { _id : row1._id};
                const updateRekonResult = { 
                    is_found: true,
                    id_rekon_result: idRekonResult,
                };
                await modelTransaksiDetail.findOneAndUpdate(filterRekonResult, updateRekonResult); 

                /* sum match */
                for(const [index, rowSum] of dataSumArra.entries()) {
                    const indexKolom = parseInt(dataSumArra[index].kolom_index);
                    total_sum_match = total_sum_match + (parseInt(row1.data_row[indexKolom]) || 0)
                }

                match.push(
                    {
                        tipe : "1",
                        id_rekon : dataRekon[0].id_rekon,
                        id_rekon_result : idRekonResult,
                        row_data : row1.data_row,
                        id_collection : row1.id_collection,
                        id_transaksi : row1.id_transaksi,
                        id_transaksi_detail : row1._id,
                    })

                break;
            } 
        }
        if(!isCocok) {

            /* sum unmatch */
            for(const [index, rowSum] of dataSumArra.entries()) {
                const indexKolom = parseInt(dataSumArra[index].kolom_index);
                total_sum_unmatch = (parseInt(total_sum_unmatch) || 0) + (parseInt(row1.data_row[indexKolom]) || 0)
            }
            unMatch.push(
                {
                    tipe : "1",
                    id_rekon : dataRekon[0].id_rekon,
                    id_rekon_result : idRekonResult,
                    row_data : row1.data_row,
                    id_collection : row1.id_collection,
                    id_transaksi : row1.id_transaksi,
                    id_transaksi_detail : row1._id.toString(),
                })
        }
    }

    
    /* sum all and save */
    for (const row1 of dataArray1) {
        for(const [index, rowSum] of dataSumArra.entries()) {
            const indexKolom = parseInt(dataSumArra[index].kolom_index);
            total_sum = total_sum + (parseInt(row1.data_row[indexKolom]) || 0)
        }
    }

    const totalUnmatch = unMatch.length;

    const dataSumArraSatu = [];
    for(const [index, rowSum] of dataSumArra.entries()) {
        dataSumArraSatu.push(rowSum); 
    }

    /* Perhitungan Fee */
    const channel = require('./models/channel');
    const dataChannel = await channel.find({_id : idChannel});

    const totalMatchData = (dataArray1.length - totalUnmatch);

    const dataRekonResult = {
        tipe : 1,
        id_rekon: dataRekon[0].id_rekon,
        id_rekon_result : idRekonResult,
        nama_rekon: dataRekon[0].nama_rekon,
        sum_result : {
            total_sum: (parseInt(total_sum) || 0),
            total_sum_match: total_sum_match,
            total_sum_unmatch: (parseInt(total_sum_unmatch) || 0)
        },
        compare_result : {
            total_data: dataArray1.length,
            total_match: (dataArray1.length - totalUnmatch),
            total_unmatch: totalUnmatch
        },
        id_channel : idChannel,
        fee_detail : {
            fee1 : {
                nilai : dataChannel[0].fee1.nilai,
                total : generateFee(dataChannel[0].fee1, totalMatchData, total_sum_match)
            },
            fee2 : {
                nilai : dataChannel[0].fee2.nilai,
                total : generateFee(dataChannel[0].fee2, totalMatchData, total_sum_match)
            },
            fee3 : {
                nilai : dataChannel[0].fee3.nilai,
                total : generateFee(dataChannel[0].fee3, totalMatchData, total_sum_match)
            },
            fee4 : {
                nilai : dataChannel[0].fee4.nilai,
                total : generateFee(dataChannel[0].fee4, totalMatchData, total_sum_match)
            },
            fee5 : {
                nilai : dataChannel[0].fee5.nilai,
                total : generateFee(dataChannel[0].fee5, totalMatchData, total_sum_match)
            },
            fee_admin : {
                nilai : dataChannel[0].fee_admin.nilai,
                total : generateFee(dataChannel[0].fee_admin, totalMatchData, total_sum_match)
            },
            fee_company : {
                nilai : 0,
                total : 0
            }
        }        
    }

    const modelRekonUnmatch = require('./models/rekon-unmatch');
    modelRekonUnmatch.insertMany(unMatch);

    const modelRekonMatch = require('./models/rekon-match');
    modelRekonMatch.insertMany(match);
    
    return dataRekonResult;

}



function generateFee(dataChannel, totalMatch, totalAmount) {
    if (dataChannel.is_prosentase === 1) {
        return ((parseInt(dataChannel.nilai) || 0) * parseInt(totalAmount)) / 100;
    } 
    return (parseInt(dataChannel.nilai) || 0) * parseInt(totalMatch);
}

