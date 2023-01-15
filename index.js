require('./library/mongo-init')();
const helper = require('./library/helper')

// cek posisi dgn cronjob tiap 30 menit
const sch = require('node-schedule');
// sch.scheduleJob('*/1 * * * *', async function(){
(async () => {
    console.log(`${helper.getDateTimeNow()} Cron Job Running...`);
    const modelRekon = require('./models/rekon');
    const dataRekon = await modelRekon.find({is_proses : 'pending'});
    // console.log(dataRekon)
    if(dataRekon.length > 0) {
        const limit = 4; // limit 5 proses per proses
        for(const [pos,row] of dataRekon.entries()) {
            if(pos == limit) break;

            // update rekon sedang di proses
            const filter = { id_rekon: row.id_rekon };
            const update = { is_proses: "proses" };
            await modelRekon.findOneAndUpdate(filter, update);

            await processData(row.id_rekon);
        }
    }
    
})()
// })

async function processData(idRekon) {
    console.log(`${helper.getDateTimeNow()} proses rekon ${idRekon}`);
    const modelRekon = require('./models/rekon');
    const modelRekonDetail = require('./models/rekon-detail');
    const modelRekonResult = require('./models/rekon-result');

    const dataRekon = await modelRekon.find({id_rekon : idRekon});
    const dataRekon1 = await modelRekonDetail.find({id_rekon : idRekon, tipe : '1'}).limit(0);
    const dataRekon2 = await modelRekonDetail.find({id_rekon : idRekon, tipe : '2'}).limit(0);

    await modelRekonResult.deleteMany({ id_rekon: dataRekon[0].id_rekon});

    console.time('time_proses');
    await processDataSatu(dataRekon, dataRekon1, dataRekon2)
    await processDataDua(dataRekon, dataRekon1, dataRekon2)
    console.timeEnd('time_proses');

    const filter = { id_rekon: dataRekon[0].id_rekon };
    const update = { is_proses: "sukses", timestamp_complete: helper.getDateTimeNow()};
    await modelRekon.findOneAndUpdate(filter, update);
}
    


async function processDataSatu(dataRekon, dataRekon1, dataRekon2) {
    console.log("proses data satu")
    const dataCompareArra = dataRekon[0].kolom_compare;
    const dataArray1 = [];
    for (const [index, value] of dataRekon1.entries()) { 
        dataArray1.push(value.data_row)
    }
    const dataArray2 = [];
    for (const [index, value] of dataRekon2.entries()) { 
        dataArray2.push(value.data_row)
    }
    
    /* to sum data */
    const dataSumArra = dataRekon[0].kolom_sum;

    const unMatch = [];
    const match = [];
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
                    dataSumArra[index].total_match = (parseInt(dataSumArra[index].total_match) || 0) + parseInt(row1[indexKolom])
                }

                match.push(
                    {
                        tipe : "1",
                        id_rekon : dataRekon[0].id_rekon,
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
                dataSumArra[index].total_unmatch = (parseInt(dataSumArra[index].total_unmatch) || 0) + parseInt(row1[indexKolom])
            }
            unMatch.push(
                {
                    tipe : "1",
                    id_rekon : dataRekon[0].id_rekon,
                    row_data : row1
                })
        }
    }

    
    /* sum all and save */
    for (const row1 of dataArray1) {
        for(const [index, rowSum] of dataSumArra.entries()) {
            if(rowSum.tipe != 1) continue;
            const indexKolom = parseInt(dataSumArra[index].kolom_index);
            dataSumArra[index].total = dataSumArra[index].total + parseInt(row1[indexKolom])
            // console.log(dataSumArra[index].total)
            // console.log(parseInt(row1[indexKolom]))
        }
    }

    const totalUnmatch = unMatch.length;
    console.log("===DATA 1 ===")
    console.log("TOTAL DATA = " + (dataArray1.length));
    console.log("TOTAL DATA MATCH = " + (dataArray1.length - totalUnmatch));
    console.log("TOTAL DATA UNMATCH = " +totalUnmatch);

    const dataSumArraSatu = [];
    console.log("=> SUMMERIZE DATA ");
    for(const [index, rowSum] of dataSumArra.entries()) {
        if(rowSum.tipe != 1) continue;
        dataSumArraSatu.push(rowSum); 
        // console.log(rowSum.kolom_name +"=> TOTAL : "+rowSum.total);
    }

    const dataRekonResult = {
        tipe : 1,
        id_rekon: dataRekon[0].id_rekon,
        nama_rekon: dataRekon[0].nama_rekon,
        sum_result : dataSumArraSatu,
        compare_result : {
            total_data: dataArray1.length,
            total_match: (dataArray1.length - totalUnmatch),
            total_unmatch: totalUnmatch
        }        
    }

    const modelRekonResult = require('./models/rekon-result');
    const data_insert = new modelRekonResult(dataRekonResult);
    await data_insert.save();

    const modelRekonUnmatch = require('./models/rekon-unmatch');
    modelRekonUnmatch.insertMany(unMatch);

    const modelRekonMatch = require('./models/rekon-match');
    modelRekonMatch.insertMany(match);

}

async function processDataDua(dataRekon, dataRekon1, dataRekon2) {
    console.log("proses data dua")
    const dataCompareArra = dataRekon[0].kolom_compare;
    const dataArray1 = [];
    for (const [index, value] of dataRekon1.entries()) { 
        dataArray1.push(value.data_row)
    }
    const dataArray2 = [];
    for (const [index, value] of dataRekon2.entries()) { 
        dataArray2.push(value.data_row)
    }

    /* to sum data */
    const dataSumArra = dataRekon[0].kolom_sum;
    
    const unMatch = [];
    const match = [];
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
                    dataSumArra[index].total_match = (parseInt(dataSumArra[index].total_match) || 0) + parseInt(row2[indexKolom])                
                }

                match.push(
                    {
                        tipe : "2",
                        id_rekon : dataRekon[0].id_rekon,
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
                dataSumArra[index].total_unmatch = (parseInt(dataSumArra[index].total_unmatch) || 0) + parseInt(row2[indexKolom])                
            }
            
            unMatch.push(
                {
                    tipe : "2",
                    id_rekon : dataRekon[0].id_rekon,
                    row_data : row2
                })
        }
    }

    
    /* sum all and save */
    for (const row2 of dataArray2) {
        for(const [index, rowSum] of dataSumArra.entries()) {
            if(rowSum.tipe != 2) continue;
            const indexKolom = parseInt(dataSumArra[index].kolom_index);
            dataSumArra[index].total = dataSumArra[index].total + parseInt(row2[indexKolom])

            
        }
    }

    const totalUnmatch = unMatch.length;
    console.log("===DATA 2 ===")
    console.log("TOTAL DATA = " + (dataArray2.length));
    console.log("TOTAL DATA MATCH = " + (dataArray2.length - totalUnmatch));
    console.log("TOTAL DATA UNMATCH = " + totalUnmatch);

    const dataSumArraDua = [];
    console.log("=> SUMMERIZE DATA ");
    for(const [index, rowSum] of dataSumArra.entries()) {
        if(rowSum.tipe != 2) continue;
        dataSumArraDua.push(rowSum);
    }

    const dataRekonResult = {
        tipe : 2,
        id_rekon: dataRekon[0].id_rekon,
        nama_rekon: dataRekon[0].nama_rekon,
        sum_result : dataSumArraDua,
        compare_result : {
            total_data: dataArray2.length,
            total_match: (dataArray2.length - totalUnmatch),
            total_unmatch: totalUnmatch
        }        
    }

    const modelRekonResult = require('./models/rekon-result');
    const data_insert = new modelRekonResult(dataRekonResult);
    await data_insert.save();

    const modelRekonUnmatch = require('./models/rekon-unmatch');
    modelRekonUnmatch.insertMany(unMatch);

    const modelRekonMatch = require('./models/rekon-match');
    modelRekonMatch.insertMany(match);
    
}

// function processData(dataRekon, dataRekon1, dataRekon2) {
//     const unMatch = [];
//     const matchIndex = [];

//     const dataCompareArra = dataRekon[0].kolom_compare;

//     for (const [index, value] of dataRekon1.entries()) { 
//         const dataRow = value.data_row;
//         let isCocok = false;
//         for (const [ind2, val2] of dataRekon2.entries()) { 
//             if(matchIndex.includes(val2.row_index)) continue;
//             // console.log("index rekon2 => " + ind2);
//             for (const [indexCompare, valCompare] of dataCompareArra.entries()) { 

//                 if(valCompare.tipe != 1) continue;

//                 const dataDua = val2.data_row[valCompare.kolom_index];
//                 const dataRekon1 = dataRow[valCompare.kolom_index]
//                 // console.log("index compare => " + indexCompare);
//                 if(dataRekon1 == dataDua) {
//                     // console.log("#" + valCompare.kolom_index + " - " + value.row_index + " cocok dengan " + val2.row_index + " => " + dataRekon1 + "=" + dataDua);
//                     isCocok = true;
//                 } else {
//                     isCocok = false;
//                     // console.log("#" + valCompare.kolom_index + " - " + value.row_index + " tidak cocok dengan " + val2.row_index + " => " + dataRekon1 + "=" + dataDua);
//                     break;
                    
//                 }
//             }
//             if(isCocok) {
//                 matchIndex.push(val2.row_index)
//                 break;
//             } 
            
//         }
//         if(!isCocok) {
//             unMatch.push(
//                 {
//                     index : value.row_index,
//                     value : value.data_row
//                 })
//         }
//         // console.log(index);
//     }
//     // console.log(unMatch.length)

// }








