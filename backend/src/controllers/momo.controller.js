import crypto from 'crypto';
import https from 'https';

const config = {
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    partnerCode: 'MOMO',
    redirectUrl: 'http://localhost:5173/',
    ipnUrl: 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    requestType: "payWithMethod",
    hostname: 'test-payment.momo.vn',
};

/**
 * @desc    API 1: Khởi tạo thanh toán (Tạo link QR)
 */
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
            path: '/v2/gateway/api/create',
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

/**
 * @desc    API 2: Kiểm tra trạng thái giao dịch (Query Status)
 * Dùng để kiểm tra xem khách đã trả tiền chưa dựa trên orderId
 */
export const checkMomoStatus = (req, res) => {
    const { orderId } = req.body; // Postman gửi {"orderId": "MOMO..."}

    if (!orderId) {
        return res.status(400).json({ message: "Thiếu orderId" });
    }

    const requestId = orderId;
    const lang = 'vi';

    // 1. Tạo chuỗi ký tự gốc cho việc truy vấn (Thứ tự: accessKey, orderId, partnerCode, requestId)
    const rawSignature = `accessKey=${config.accessKey}&orderId=${orderId}&partnerCode=${config.partnerCode}&requestId=${requestId}`;

    // 2. Tạo chữ ký
    const signature = crypto
        .createHmac('sha256', config.secretKey)
        .update(rawSignature)
        .digest('hex');

    // 3. Đóng gói dữ liệu
    const requestBody = JSON.stringify({
        partnerCode: config.partnerCode,
        requestId: requestId,
        orderId: orderId,
        signature: signature,
        lang: lang
    });

    // 4. Cấu hình gửi request tới MoMo
    const options = {
        hostname: config.hostname,
        port: 443,
        path: '/v2/gateway/api/query',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
            const result = JSON.parse(data);
            
            // Logic xử lý kết quả
            // resultCode = 0: Thanh toán thành công
            // resultCode = 1000: Đang chờ thanh toán
            res.json({
                success: true,
                message: result.message,
                resultCode: result.resultCode,
                data: result
            });
        });
    });

    request.on('error', (e) => {
        res.status(500).json({ success: false, message: e.message });
    });

    request.write(requestBody);
    request.end();
};
