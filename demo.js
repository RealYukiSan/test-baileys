const P = require("pino")
const  { makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")

async function test() {
        const { state, saveCreds } = await useMultiFileAuthState('sessions')
        const conn = makeWASocket({ auth: state, logger: P({
                "name": "testing",
                'enabled': true,
                'transport': {
                        'target': 'pino-pretty',
                        'options': {
                        'colorize': true,
                        'ignore': 'hostname',
                        'hideObject': true,
                        },
                },
                timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
                level: 'trace' }),
                printQRInTerminal: true
        })
        conn.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update
                if(connection === 'close') {
                        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                        console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
                        // reconnect if not logged out
                        if(shouldReconnect) {
                                test()
                        }
                } else if(connection === 'open') {
                        console.log('opened connection')
                }
        })
        conn.ev.on ('creds.update', saveCreds)
        conn.ev.on('messages.upsert', test => {
                console.log(test)
        })
}

test()