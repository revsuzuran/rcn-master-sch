require('./library/mongo-init')();
const helper = require('./library/helper')
const logging = require('./library/logging-helper')

// cek posisi dgn cronjob tiap 30 menit
const sch = require('node-schedule');
sch.scheduleJob('*/1 * * * *', async function(){
// (async () => {
    
    console.log(`${helper.getDateTimeNow()} Cron Job Running...`);    
    /* Proses Rekon Manual */
    const modelRekonResult = require('./models/rekon-result');
    const dataRekon = await modelRekonResult.find({is_proses : 'pending', 'is_schedule' : 0});
    if(dataRekon.length > 0) {
        const limit = 4; // limit 5 proses per proses
        for(const [pos,row] of dataRekon.entries()) {
            if(pos == limit) break;

            // update rekon sedang di proses
            const filter = { id_rekon: row.id_rekon, id_rekon_result : row.id_rekon_result};
            const update = { is_proses: "proses" };
            await modelRekonResult.findOneAndUpdate(filter, update);
            await processData(row.id_rekon, row.id_channel, row.id_rekon_result);
        }
    }

    /* Proses Rekon Sch */
    // const dataRekonSch = await modelRekon.find({'is_schedule' : 1});
    // if(dataRekonSch.length > 0) {
    //     for(const [pos,row] of dataRekonSch.entries()) {
            
    //         const timeNow = moment().format('HH:mm');
    //         if(row.detail_schedule.time == timeNow) {
    //             // update rekon sedang di proses
    //             const filter = { id_rekon: row.id_rekon };
    //             const update = { is_proses: "proses" };
    //             await modelRekon.findOneAndUpdate(filter, update);

    //             if(row.)

    //             await processData(row.id_rekon);
    //         }           
    //     }
    // }
    
// })()
})

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

    for (const row1 of dataArray1) {
        let isCocok = false;
        for (const row2 of dataArray2) {
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
                /* sum match */
                for(const [index, rowSum] of dataSumArra.entries()) {
                    if(rowSum.tipe != 1) continue;
                    const indexKolom = parseInt(dataSumArra[index].kolom_index);
                    total_sum_match = total_sum_match + parseInt(row1[indexKolom])
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
                total_sum_unmatch = total_sum_unmatch + parseInt(row1[indexKolom])
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
            total_sum = total_sum + parseInt(row1[indexKolom])
        }
    }

    const totalUnmatch = unMatch.length;
    // console.log("===DATA 1 ===")
    // console.log("TOTAL DATA = " + (dataArray1.length));
    // console.log("TOTAL DATA MATCH = " + (dataArray1.length - totalUnmatch));
    // console.log("TOTAL DATA UNMATCH = " +totalUnmatch);

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
            total_sum: total_sum,
            total_sum_match: total_sum_match,
            total_sum_unmatch: total_sum_unmatch
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
    
    for (const row2 of dataArray2) {
        let isCocok = false;
        for (const row1 of dataArray1) {
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
                /* sum match */
                for(const [index, rowSum] of dataSumArra.entries()) {
                    if(rowSum.tipe != 2) continue;
                    const indexKolom = parseInt(dataSumArra[index].kolom_index);
                    total_sum_match = total_sum_match + parseInt(row2[indexKolom])              
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
                total_sum_unmatch = total_sum_unmatch + parseInt(row2[indexKolom])            
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
            total_sum = total_sum + parseInt(row2[indexKolom])            
        }
    }

    const totalUnmatch = unMatch.length;
    // console.log("===DATA 2 ===")
    // console.log("TOTAL DATA = " + (dataArray2.length));
    // console.log("TOTAL DATA MATCH = " + (dataArray2.length - totalUnmatch));
    // console.log("TOTAL DATA UNMATCH = " + totalUnmatch);

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
            total_sum: total_sum,
            total_sum_match: total_sum_match,
            total_sum_unmatch: total_sum_unmatch
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



function generateFee(dataChannel, totalMatch, totalAmount) {
    if (dataChannel.is_prosentase === 1) {
        return ((parseInt(dataChannel.nilai) || 0) * parseInt(totalAmount)) / 100;
    } 
    return (parseInt(dataChannel.nilai) || 0) * parseInt(totalMatch);
}




