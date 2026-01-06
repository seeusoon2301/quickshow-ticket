// Thay require bằng import
import crypto from 'crypto';
import https from 'https';

const config = {
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    partnerCode: 'MOMO',
    redirectUrl: 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    ipnUrl: 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    requestType: "payWithMethod",
    hostname: 'test-payment.momo.vn',
    path: '/v2/gateway/api/create'
};

// Thêm từ khóa export trước hàm
export const createPayment = (amount, orderInfo) => {
    return new Promise((resolve, reject) => {
        const orderId = config.partnerCode + new Date().getTime();
        const requestId = orderId;
        const extraData = '';
        const orderGroupId = '';
        const autoCapture = true;
        const lang = 'vi';

        const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${config.redirectUrl}&requestId=${requestId}&requestType=${config.requestType}`;
        
        const signature = crypto
            .createHmac('sha256', config.secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode: config.partnerCode,
            partnerName: "Test Store",
            storeId: "MomoTestStore",
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: config.redirectUrl,
            ipnUrl: config.ipnUrl,
            lang: lang,
            requestType: config.requestType,
            autoCapture: autoCapture,
            extraData: extraData,
            orderGroupId: orderGroupId,
            signature: signature
        });

        const options = {
            hostname: config.hostname,
            port: 443,
            path: config.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });

        req.on('error', (e) => reject(e));
        req.write(requestBody);
        req.end();
    });
};

// Xóa dòng module.exports cũ