const puppeteer = require('puppeteer');
const { PNG } = require('pngjs');
const fs = require("fs");
const ProtobufLibrary = require('@tum-far/ubii-msg-formats/dist/js/protobuf');
const UbiiImage2D = ProtobufLibrary.ubii.dataStructure.Image2D;
const sharp = require('sharp');


class WebsiteRenderer {
    constructor(ubiiNode) {
        if (!ubiiNode) {
            throw Error("Please pass the Ubii Node to the WebsiteRenderer");
        }
        this.ubiiNode = ubiiNode;
        this.isTyping = false;
    }

    async init(url) {
        this.width = 1920;
        this.height = 1080;
        if (!url) {
            throw new Error('A URL must be provided as a parameter.');
        }
        this.url = url;

        try {
            // Launch a headless browser
            this.browser = await puppeteer.launch({
                headless: false, // Runs in headless mode
                ignoreHTTPErrors: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'], // Additional security configurations
            });

            // Open a new page in the browser
            this.page = await this.browser.newPage();
            // Ignore HTTPS errors for the page
            await this.page.setJavaScriptEnabled(true);
            await this.page.setExtraHTTPHeaders({
                'Bypass-SSL-Error': 'True',
            });

            await this.page.setViewport({
                width: this.width,
                height: this.height,
                deviceScaleFactor: 1,
                isMobile: false
            });

            // Navigate to the provided URL
            await this.page.goto(this.url, { waitUntil: 'load' });

            console.log(`Puppeteer browser launched and navigated to: ${this.url}`);

            // Return the browser instance
            this.initUbiiSubscriptions()
            return this;
        } catch (error) {
            console.error('Error starting Puppeteer browser:', error);
            throw error;
        }
    }

    initUbiiSubscriptions() {
        const testTopic = "sessionId" + '/test-topic/imagedata';

        let counter = 0;
        let intervalPublishScreenshot = setInterval(async () => {
            const screenShotData = await this.getScreenshotAsRGB8();
            this.ubiiNode.publishRecord({
                topic: testTopic,
                image2D: {
                    width: screenShotData.width,
                    height: screenShotData.height,
                    data: screenShotData.data,
                    dataFormat: UbiiImage2D.DataFormat.RGB8
                }
            })
        }, 1000);


        this.ubiiNode.subscribeRegex("sessionId\/mousemove", this.handleMouseMove.bind(this));
        this.ubiiNode.subscribeRegex("sessionId\/mouseup", this.handleMouseUp.bind(this));
        this.ubiiNode.subscribeRegex("sessionId\/mousedown", this.handleMouseDown.bind(this));
        this.ubiiNode.subscribeRegex("touch_events", this.handleTouchEvents.bind(this));
        //this.ubiiNode.subscribeTopic("sessionId/mouse_move", this.handleMouseMove.bind(this));
        this.ubiiNode.subscribeTopic("sessionId/speech_to_text", this.handleTextInput.bind(this));
    }

    async getScreenshotAsRGB8() {
        //console.log("capturing");
        try {
            // Capture screenshot as a buffer (PNG format)
            const pngBuffer = await this.page.screenshot({ type: 'png'});
            //await this.page.screenshot({ path: "./screenshot.png" });

            // Parse the PNG buffer to extract pixel data
            // console.log("PNG BUffer", pngBuffer);
            // const PNGOBJ = new PNG();
            // const png = PNGOBJ.parse(pngBuffer);
            // const { width, height, data } = png;
            // const width = this.width;
            // const height = this.height;

            // Convert the screenshot buffer to RGB8 format
            const { data, info } = await sharp(pngBuffer).raw()
                .toBuffer({ resolveWithObject: true });
            const width = info.width;
            const height = info.height;
            //var buffer = PNG.sync.write(png);
            //fs.writeFileSync('out.png', buffer);

            // Return the raw RGB data (in the format: [R, G, B, R, G, B, ...])
            return { data, width, height };
        } catch (error) {
            //await this.browser.close();
            throw error;
        }
    }



    handleMouseMove(event) {
        const x = event.vector2.x * this.width;
        const y = event.vector2.y * this.height;
        try {
            this.page.mouse.move(x, y);
        } catch (e) {
            console.log("Error", e);
        }
    }

    handleMouseUp(event) {
        const x = event.vector2.x * this.width;
        const y = event.vector2.y * this.height;
        try {
            this.page.mouse.up(x, y);
        } catch (e) {
            console.log("Error", e);
        }
    }

    handleMouseDown(event) {
        const x = event.vector2.x * this.width;
        const y = event.vector2.y * this.height;
        try {
            this.page.mouse.down(x, y);
        } catch (e) {
            console.log("Error", e);
        }
    }


    async handleTouchEvents(event) {
        const touchEvents = event.touchEventList.elements
        console.log("toucheventLits", event.touchEventList);
        console.log("elements", event.touchEventList.elements);
        if(touchEvents){
            for (const event of touchEvents) {
                const x = event.position.x * this.width;
                const y = event.position.y * this.height;
                console.log("Event", event);
                try {
                    if (event.type === ProtobufLibrary.ubii.dataStructure.TouchEvent.TouchEventType.TOUCH_START) {
                        console.log("mouse down", this.page.touchscreen.touchStart);
                        await this.page.touchscreen.touchStart(x, y);
                    } else if (event.type === ProtobufLibrary.ubii.dataStructure.TouchEvent.TouchEventType.TOUCH_END) {
                        console.log("mouse up");
                        await this.page.touchscreen.touchEnd();
                    } else if (event.type === ProtobufLibrary.ubii.dataStructure.TouchEvent.TouchEventType.TOUCH_MOVE) {
                        console.log("mouse move");
                        await this.page.touchscreen.touchMove(x, y);
                    }
                } catch (e) {
                    console.log("Error", e);
                }
            }
        }
    }


    handleTextInput(event) {
        console.log("typing", event.string);
        if (!this.isTyping) {
            this.isTyping = true;
            this.page.keyboard.type(event.string);
            this.isTyping = false;
        }
        else {
            setTimeout(() => this.handleTextInput(event).bind(this), 200);
        }

    }
}

module.exports = WebsiteRenderer;
