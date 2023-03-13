require('dotenv').config();
const axios = require('axios');

async function sendPost(data) {
    const axiosConfig = {
        method: 'post',
        'url': process.env.URL_FRONT_END,
        headers: {
            'Content-Type': 'application/json',
        },
        'data': data,
    };

    const response = await axios.request(axiosConfig);    
    // console.log("Response : " + JSON.stringify(response.data));
    return response.data;
}

module.exports = {
    sendPost,
}