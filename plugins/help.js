import { promises } from 'fs'
import { join } from 'path'
import jimp from 'jimp'
import PhoneNumber from 'awesome-phonenumber'
import fetch from 'node-fetch'
import { xpRange } from '../lib/levelling.js'
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = pkg;
let tags = {
}
const defaultMenu = {
  before: 'Hi, %name 👋\n\n> Date: %date\n> Time: %time WIB\n> Runtime: %uptime\n%readmore',
  header: '┏━━⊜ *_%category_* ━⊜',
  body: '┃⋄ %cmd %islimit %isPremium',
  footer: '┗━━━━━━━━🥀\n',
  after: '',
}
const images = [
  'spam/kite.jpg',
  'spam/hxh1.jpg',
  'spam/hxh2.jpg',
  'spam/hxh3.jpg',
  'spam/hxh4.jpg'
];


let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    let name = m.pushName || conn.getName(m.sender)
    let d = new Date(new Date + 3600000)
    let locale = 'id'
    let audioPath = 'spam/hxh.mp3';
    // d.getTimeZoneOffset()
    // Offset -420 is 18.00
    // Offset    0 is  0.00
    // Offset  420 is  7.00
    let date = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Casablanca'
    })
    let time = d.toLocaleTimeString(locale, { timeZone: 'Africa/Casablanca' })
    time = time.replace(/[.]/g, ':')
    let _uptime
    if (process.send) {
      process.send('uptime')
      _uptime = await new Promise(resolve => {
        process.once('message', resolve)
        setTimeout(resolve, 1000)
      }) * 1000
    }
    let uptime = clockString(_uptime)
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }
    })
    for (let plugin of help)
      if (plugin && 'tags' in plugin)
        for (let tag of plugin.tags)
          if (!(tag in tags) && tag) tags[tag] = tag
    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag].toUpperCase()) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                .replace(/%islimit/g, menu.limit ? '(Limit)' : '')
                .replace(/%isPremium/g, menu.premium ? '(Premium)' : '')
                .trim()
            }).join('\n')
          }),
          footer
        ].join('\n')
      }),
      after
    ].join('\n')
    let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
    let replace = {
      '%': '%',
      p: _p, uptime,
      me: conn.getName(conn.user.jid),
      name, date, time,
      readmore: readMore
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])

    //let buffer = await genProfile(conn, m)
    const randomImage = images[Math.floor(Math.random() * images.length)];
    const interactiveMessage = {
        body: { text: text.trim() },
        footer: { text: "_By Mee6Team_" },
        header: {
        hasMediaAttachment: true,...(await prepareWAMessageMedia({ image: { url: randomImage } }, { upload: conn.waUploadToServer }))
        },
        contextInfo: { 
          	mentionedJid: [m.sender], 
        	isForwarded: true, 
	        forwardedNewsletterMessageInfo: {
			newsletterJid: '120363194444713984@newsletter',
			newsletterName: "Mee6", 
			serverMessageId: -1
		}
          },
        nativeFlowMessage: { 
            buttons: [{ 
                name: "cta_url",
                buttonParamsJson: `{"display_text":"عرض القناة","url":"https://whatsapp.com/channel/0029Va8dVNTGE56gO21d3a3c"}`
            }]
        }
    };

    const message = { 
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, 
        interactiveMessage 
    };

    await conn.relayMessage(m.chat, { viewOnceMessage: { message } }, {});
    await conn.sendMessage(m.chat, { audio: fs.readFileSync(audioPath), mimetype: 'audio/mp4' }, { quoted: m });
    m.react('📚') 
  } catch (e) {
    conn.reply(m.chat, 'An error occurred', m)
    throw e
  }
}
handler.command = /^(help|menu|\?)$/i;
handler.rowner = true;
export default handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
