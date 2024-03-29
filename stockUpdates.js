const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

async function trackStockPrice() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // this goes to yahoo finance
        await page.goto('https://finance.yahoo.com/quote/MSFT');//we are using microsoft for stock example
        await page.waitForSelector("fin-streamer[data-symbol='MSFT']");

        // set initial stock price
        const stockPriceElement = await page.$("fin-streamer[data-symbol='MSFT']");
        const stockPrice = parseFloat(await page.evaluate(element => element.getAttribute('value'), stockPriceElement));

        console.log('Initial stock price:', stockPrice);

        // email setter upper
        const transporter = nodemailer.createTransport({
            service: 'Outlook',
            auth: {
                user: 'EMAIL',
                pass: 'PASSWORD' //iot sign in
            }
        });

        // email yourself the initial stock price
        const mailOptions = {
            from: 'EMAIL',
            to: 'EMAIL',
            subject: 'Initial Stock Price',
            text: `Initial stock price for Microsoft (MSFT) is: ${stockPrice}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        let previousStockPrice = stockPrice;
        const threshold = 0.5; // Change this to your desired percentage threshold

        // continuously monitor the stock price
        setInterval(async () => {
            await page.reload();
            const updatedStockPriceElement = await page.$("fin-streamer[data-symbol='MSFT']");
            const updatedStockPrice = parseFloat(await page.evaluate(element => element.getAttribute('value'), updatedStockPriceElement));

            console.log('Updated stock price:', updatedStockPrice);

            const priceChange = updatedStockPrice - previousStockPrice;
            const percentageChange = (priceChange / previousStockPrice) * 100;

            if (Math.abs(percentageChange) >= threshold) {
                // update time!
                const mailOptions = {
                    from: 'EMAIL',
                    to: 'EMAIL',
                    subject: 'Stock Price Update',
                    text: `Updated stock price for Microsoft (MSFT) is: ${updatedStockPrice} compared to the previous price of ${previousStockPrice}`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.error('Error sending email:', error);
                    } else {
                        console.log('Email sent:', info.response);
                    }
                });

                previousStockPrice = updatedStockPrice;
            }
        }, 600000); // 600000 milliseconds is 10 minutes FYI, set as desired
    } catch (error) {
        console.error('Failed to retrieve stock price:', error);
    } finally {
        await browser.close();
    }
}

trackStockPrice();
