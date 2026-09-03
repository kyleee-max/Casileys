
<h1 align="center">🌱 Casileys</h1>
<p align="center">
  <img src="./casileys-header.gif" alt="Casileys" width="100%">
</p>


<p align="center">
  A WhatsApp Web API library for Node.js, based on Baileys and extended with additional message types, media handling, interactive messages, newsletter support, and more.
</p>

<p align="center">
  <a href="https://npmjs.com/package/@kaels/casileys"><img src="https://img.shields.io/npm/v/@kaels/casileys?style=for-the-badge&logo=npm"/></a>
  <a href="https://npmjs.com/package/@kaels/casileys"><img src="https://img.shields.io/npm/dm/@kaels/casileys?style=for-the-badge&logo=npm"/></a>
  <a href="https://github.com/kyleee-max/casileys"><img src="https://img.shields.io/github/stars/kyleee-max/casileys?style=for-the-badge&logo=github"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge"/></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&labelColor=green&logoColor=white&style=for-the-badge"/></a>
  <a href="#"><img src="https://img.shields.io/badge/ESM-only?logo=javascript&labelColor=yellow&logoColor=black&style=for-the-badge"/></a>
</p>

---

## ✨ Highlights

| Feature | Support |
|---|:---:|
| WhatsApp Web / Multi-device | ✅ |
| Pairing Code | ✅ |
| Text & Media Messages | ✅ |
| Albums | ✅ |
| Polls | ✅ |
| Interactive Messages | ✅ |
| Rich Responses | ✅ |
| Inline Entities | ✅ |
| Tables | ✅ |
| Group Status | ✅ |
| Sticker Pack | ✅ |
| Newsletter Messages | ✅ |
| Group Management | ✅ |
| Community Management | ✅ |
| Profile Management | ✅ |
| Business Features | ✅ |
| Privacy Management | ✅ |
| Message Editing & Deletion | ✅ |

Casileys is designed to remain readable and auditable while extending the functionality available from its upstream fork.

---

## 🛠️ Internal Adjustments

Casileys retains the existing message and protocol implementations from its fork base while adding project-specific improvements.

Some of the included changes cover:

- Newsletter media handling
- `makeInMemoryStore` support
- Extended interactive message support
- Album messages
- Group status messages
- Additional message wrappers
- Extended media handling
- Direct `externalAdReply` access
- Additional newsletter, group, community, profile, business, and privacy utilities
- Casileys Group Status Helper

---

## 📨 Message Compatibility

The message layer supports the following extended structures:

| Message Type | Available |
|---|:---:|
| Album | ✅ |
| Group Status | ✅ |
| Interactive | ✅ |
| Status Mention | ✅ |
| Sticker Pack | ✅ |
| Rich Response | ✅ |
| Code Block | ✅ |
| Inline Entities | ✅ |
| Table | ✅ |
| Payment-related Messages | ✅ |
| External Ad Reply | ✅ |
| View Once Variants | ✅ |
| Ephemeral | ✅ |
| Spoiler | ✅ |
| Lottie Sticker | ✅ |
| Raw Message | ✅ |

---

## 📥 Installation

**package.json**

```json
"dependencies": {
   "@kaels/casileys": "latest"
}
```

**GitHub**

```json
"dependencies": {
   "@kaels/casileys": "github:kyleee-max/casileys"
}
```

**Terminal**

```bash
npm i @kaels/casileys@latest
```

Or directly from GitHub:

```bash
npm i github:kyleee-max/casileys
```

---

## 🧩 Import

**ESM**

```js
import { makeWASocket } from '@kaels/casileys'
```

**CJS**

```js
const { makeWASocket } = require('@kaels/casileys')
```

---

## 🌐 Connect to WhatsApp

```js
import { makeWASocket, delay, DisconnectReason, useMultiFileAuthState } from '@kaels/casileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'

// --- Connect with pairing code
const myPhoneNumber = '6288888888888'

const logger = pino({ level: 'silent' })

const connectToWhatsApp = async () => {
   const { state, saveCreds } = await useMultiFileAuthState('session')

   const sock = makeWASocket({
      logger,
      auth: state
   })
   sock.ev.on('creds.update', saveCreds)
   sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update
      if (connection === 'connecting' && !sock.authState.creds.registered) {
         await delay(1500)
         const code = await sock.requestPairingCode(myPhoneNumber)
         console.log('🔗 Pairing code', ':', code)
      }
      else if (connection === 'close') {
         const shouldReconnect = new Boom(connection?.lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
         console.log('⚠️ Connection closed because', lastDisconnect.error, ', reconnecting ', shouldReconnect)
         if (shouldReconnect) {
            connectToWhatsApp()
         }
      }
      else if (connection === 'open') {
         console.log('✅ Successfully connected to WhatsApp')
      }
   })
   sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const message of messages) {
         if (!message.message) continue

         console.log('🔔 Got new message', ':', message)
         await sock.sendMessage(message.key.remoteJid, {
            text: '👋🏻 Hello world'
         })
      }
   })
}

connectToWhatsApp()
```

---

## 🔐 Auth State

You can use `useMultiFileAuthState` as the default authentication state implementation.

Experimental alternatives such as `useSingleFileAuthState` and `useSqliteAuthState` may also be used where supported.

---

## 🗄️ Data Store

```js
import { makeWASocket, makeInMemoryStore, delay, DisconnectReason, useMultiFileAuthState } from '@kaels/casileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'

const myPhoneNumber = '6288888888888'

// --- Create your store path
const storePath = './store.json'

const logger = pino({ level: 'silent' })
const connectToWhatsApp = async () => {
   const { state, saveCreds } = await useMultiFileAuthState('session')

   const sock = makeWASocket({
      logger,
      auth: state
   })

   const store = makeInMemoryStore({
      logger,
      socket: sock
   })

   store.bind(sock.ev)

   sock.ev.on('creds.update', saveCreds)
   sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update
      if (connection === 'connecting' && !sock.authState.creds.registered) {
         await delay(1500)
         const code = await sock.requestPairingCode(myPhoneNumber)
         console.log('🔗 Pairing code', ':', code)
      }
      else if (connection === 'close') {
         const shouldReconnect = new Boom(connection?.lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
         console.log('⚠️ Connection closed because', lastDisconnect.error, ', reconnecting ', shouldReconnect)
         if (shouldReconnect) {
            connectToWhatsApp()
         }
      }
      else if (connection === 'open') {
         console.log('✅ Successfully connected to WhatsApp')
      }
   })
   sock.ev.on('chats.upsert', () => {
      console.log('✉️ Got chats', store.chats.all())
   })

   sock.ev.on('contacts.upsert', () => {
      console.log('👥 Got contacts', Object.values(store.contacts))
   })

   // --- Read store from file
   store.readFromFile(storePath)

   // --- Save store every 3 minutes
   setInterval(() => {
      store.writeToFile(storePath)
   }, 180000)
}

connectToWhatsApp()
```

> **Note:** For large applications, consider using a dedicated persistent data store instead of keeping the entire chat history in memory.

---

## 🪪 WhatsApp IDs

`jid` identifies the WhatsApp account, group, broadcast destination, newsletter, or status target involved in an operation.

| Target | Format |
|---|---|
| User | `[country code][phone]@s.whatsapp.net` |
| LID | `[id]@lid` |
| Group | `[id]@g.us` |
| Meta AI | `[id]@bot` |
| Broadcast | `[timestamp]@broadcast` |
| Status | `status@broadcast` |
| Newsletter | `[id]@newsletter` |

For incoming messages, the destination is commonly available through:

```js
message.key.remoteJid
```

---

## ✉️ Sending Messages

### 🔠 Text

```js
// --- Send a regular text message
sock.sendMessage(jid, {
   text: '👋🏻 Hello'
}, {
   quoted: message
})

// --- Send a text message with a link preview
const urlA = 'https://www.npmjs.com/package/@kaels/casileys'
sock.sendMessage(jid, {
   text: urlA + ' 👆🏻 Check it out!',
   linkPreview: {
      'matched-text': urlA,
      title: '🌱 Casileys',
      description: 'WhatsApp Web API for Node.js',
      previewType: 0, // --- Use 1 for video playback in the link preview
      jpegThumbnail: fs.readFileSync('./path/to/image.jpg')
   }
})

// --- Send a text message with a large link preview and favicon
import { prepareWAMessageMedia } from 'YOUR_CASILEYS_PACKAGE'
const urlB = 'https://www.npmjs.com/package/@kaels/casileys#readme'

const { imageMessage: image } = await prepareWAMessageMedia({
   image: {
      url: './path/to/image.jpg'
   }
}, {
   upload: sock.waUploadToServer,
   mediaTypeOverride: 'thumbnail-link'
})

// --- Set the thumbnail display size
image.height = 720
image.width = 480
sock.sendMessage(jid, {
   text: urlB + ' 👆🏻 Check it out!',
   linkPreview: {
      'matched-text': urlB,
      title: '🌱 Casileys',
      description: 'WhatsApp Web API for Node.js',
      previewType: 0,
      jpegThumbnail: fs.readFileSync('./path/to/image.jpg'),
      highQualityThumbnail: image,
      linkPreviewMetadata: {
         linkMediaDuration: 0, // --- Duration in seconds (for video/audio content)
         socialMediaPostType: 1, // --- Enum: 0 = NONE, 1 = REEL, 2 = LIVE_VIDEO, 3 = LONG_VIDEO, 4 = SINGLE_IMAGE, 5 = CAROUSEL
      } // --- Additional metadata for large link preview
   },
   favicon: {
      url: './path/to/tiny-image.ico'
   }
})
```

### 🔔 Mention

```js
// --- Regular mention
sock.sendMessage(jid, {
   text: '👋🏻 Hello @628123456789',
   mentions: ['628123456789@s.whatsapp.net']
}, {
   quoted: message
})

// --- Mention all
sock.sendMessage(jid, {
   text: '👋🏻 Hello @all',
   mentionAll: true
}, {
   quoted: message
})
```

### 😁 Reaction

```js
sock.sendMessage(jid, {
   react: {
      key: message.key,
      text: '✨'
   }
})
```

### 📌 Pin Message

```js
sock.sendMessage(jid, {
   pin: message.key,
   time: 86400, // --- Set the value in seconds: 86400 (1d), 604800 (7d), or 2592000 (30d)
   type: 1 // --- Or 2 to remove
})
```

### 🔖 Keep Chat

> **Note:** Keep Chat can only be used in chats or groups with disappearing messages enabled.

```js
sock.sendMessage(jid, {
   keep: message.key,
   type: 1 // --- Or 2 to remove
})
```

### ➡️ Forward Message

```js
sock.sendMessage(jid, {
   forward: message,
   force: true // --- Optional
})
```

### 👤 Contact

```js
const vcard = 'BEGIN:VCARD\n'
            + 'VERSION:3.0\n'
            + 'FN:Casileys User\n'
            + 'ORG:Casileys;\n'
            + 'TEL;type=CELL;type=VOICE;waid=628123456789:+62 8123 4567 89\n'
            + 'END:VCARD'

sock.sendMessage(jid, {
   contacts: {
      displayName: 'Casileys User',
      contacts: [
         { vcard }
      ]
   }
}, {
   quoted: message
})
```

### 📍 Location

```js
sock.sendMessage(jid, {
   location: {
      degreesLatitude: 24.121231,
      degreesLongitude: 55.1121221,
      name: '👋🏻 I am here'
   }
}, {
   quoted: message
})
```

### 🗓️ Event

```js
sock.sendMessage(jid, {
   event: {
      name: '🎶 Meet & Mingle Party',
      description: 'Meet & Mingle Party is a fun, casual gathering to connect, chat, and build new relationships within the community.',
      call: 'audio', // --- Or "video", this field is optional
      startDate: new Date(Date.now() + 3600000),
      endDate: new Date(Date.now() + 28800000),
      isCancelled: false, // --- Optional
      isScheduleCall: false, // --- Optional
      extraGuestsAllowed: false, // --- Optional
      location: {
         name: 'Jakarta',
         degreesLatitude: -6.2,
         degreesLongitude: 106.8
      }
   }
}, {
   quoted: message
})
```

### 👥 Group Invite

```js
const inviteCode = groupUrl
   .split('chat.whatsapp.com/')[1]
   ?.split('?')[0]

const groupJid = '1201111111111@g.us'
const groupName = 'Casileys'

sock.sendMessage(jid, {
   groupInvite: {
      inviteCode,
      inviteExpiration: Date.now() + 86400000,
      text: '👋🏻 Hello, we invite you to join our group.',
      jid: groupJid,
      subject: groupName,
   }
}, {
   quoted: message
})
```

### 🛍️ Product

```js
import { randomUUID } from 'crypto'
sock.sendMessage(jid, {
   image: {
      url: './path/to/image.jpg'
   },
   body: '👋🏻 Check my product here!',
   footer: 'Casileys',
   product: {
      currencyCode: 'IDR',
      description: '🛍️ Interesting product!',
      priceAmount1000: 70_000_000,
      productId: randomUUID(),
      productImageCount: 1,
      salePriceAmount1000: 65_000_000,
      signedUrl: 'YOUR_PRODUCT_URL',
      title: '📦 Casileys Product',
      url: 'YOUR_PRODUCT_URL'
   },
   businessOwnerJid: '0@s.whatsapp.net'
})
```

### 📊 Poll

```js
// --- Regular poll message
sock.sendMessage(jid, {
   poll: {
      name: '🔥 Voting time',
      values: ['Yes', 'No'],
      selectableCount: 1,
      toAnnouncementGroup: false,
      endDate: new Date(Date.now() + 28800000), // --- Optional
      hideVoter: false, // --- Optional
      canAddOption: false // --- Optional
   }
}, {
   quoted: message
})

// --- Quiz (only for newsletter)
sock.sendMessage('1211111111111@newsletter', {
   poll: {
      name: '🔥 Quiz',
      values: ['Yes', 'No'],
      correctAnswer: 'Yes',
      pollType: 1
   }
}, {
   quoted: message
})

// --- Poll result
sock.sendMessage(jid, {
   pollResult: {
      name: '📝 Poll Result',
      votes: [{
         name: 'Nice',
         voteCount: 10
      }, {
         name: 'Nah',
         voteCount: 2
      }],
      pollType: 0 // Or 1 for quiz
   }
}, {
   quoted: message
})

// --- Poll update
sock.sendMessage(jid, {
   pollUpdate: {
      metadata: {},
      key: message.key
   }
}, {
   quoted: message
})
```

---

## 📁 Sending Media Messages

### 🖼️ Image

```js
sock.sendMessage(jid, {
   image: {
      url: './path/to/image.jpg'
   },
   caption: '🖼️ Image'
}, {
   quoted: message
})
```

### 🎥 Video

```js
sock.sendMessage(jid, {
   video: {
      url: './path/to/video.mp4'
   },
   caption: '🎥 Video'
}, {
   quoted: message
})
```

### 📃 Sticker

```js
sock.sendMessage(jid, {
   sticker: {
      url: './path/to/sticker.webp'
   }
}, {
   quoted: message
})
```

### 💽 Audio

```js
sock.sendMessage(jid, {
   audio: {
      url: './path/to/audio.mp3'
   },
   mimetype: 'audio/mpeg',
   ptt: false
}, {
   quoted: message
})
```

### 🗂️ Document

```js
sock.sendMessage(jid, {
   document: {
      url: './path/to/document.pdf'
   },
   mimetype: 'application/pdf',
   fileName: 'document.pdf',
   caption: '📄 Document'
}, {
   quoted: message
})
```

---

## 🖼️ Album

```js
sock.sendMessage(jid, {
   album: [
      {
         image: {
            url: './path/to/image-1.jpg'
         }
      },
      {
         image: {
            url: './path/to/image-2.jpg'
         }
      },
      {
         video: {
            url: './path/to/video.mp4'
         }
      }
   ]
}, {
   quoted: message
})
```

---

## 📦 Sticker Pack

```js
sock.sendMessage(jid, {
   stickerPack: {
      name: 'Casileys Pack',
      publisher: 'Casileys',
      description: 'Casileys sticker pack'
   }
}, {
   quoted: message
})
```

---

## 👉🏻 Interactive Messages

### 🔘 Buttons

```js
sock.sendMessage(jid, {
   buttons: [
      {
         buttonId: 'id1',
         buttonText: {
            displayText: 'Button 1'
         },
         type: 1
      },
      {
         buttonId: 'id2',
         buttonText: {
            displayText: 'Button 2'
         },
         type: 1
      }
   ],
   text: 'Select an option',
   footer: 'Casileys'
}, {
   quoted: message
})
```

### 📋 List

```js
sock.sendMessage(jid, {
   text: 'Select an option',
   footer: 'Casileys',
   title: 'Casileys Menu',
   buttonText: 'Open',
   sections: [
      {
         title: 'Menu',
         rows: [
            {
               title: 'Option 1',
               description: 'First option',
               rowId: 'option_1'
            },
            {
               title: 'Option 2',
               description: 'Second option',
               rowId: 'option_2'
            }
         ]
      }
   ]
}, {
   quoted: message
})
```

### 🗄️ Interactive

```js
sock.sendMessage(jid, {
   interactiveMessage: {
      body: {
         text: 'Casileys Interactive'
      },
      footer: {
         text: 'Select an action'
      },
      nativeFlowMessage: {
         buttons: [
            {
               name: 'quick_reply',
               buttonParamsJson: JSON.stringify({
                  display_text: 'Open',
                  id: 'open'
               })
            }
         ]
      }
   }
}, {
   quoted: message
})
```

### 🫙 Hydrated Template

```js
sock.sendMessage(jid, {
   hydratedTemplate: {
      hydratedContentText: 'Casileys',
      hydratedFooterText: 'WhatsApp Web API',
      hydratedButtons: [
         {
            quickReplyButton: {
               displayText: 'Open',
               id: 'open'
            }
         }
      ]
   }
}, {
   quoted: message
})
```

---

## 💳 Sending Payment Messages

Payment-related structures are exposed through the corresponding message types.

### ➕ Invite Payment

```js
sock.sendMessage(jid, {
   paymentInviteMessage: {
      serviceType: 3,
      expiryTimestamp: Math.floor(Date.now() / 1000) + 86400
   }
}, {
   quoted: message
})
```

### 🧾 Invoice

Invoice support depends on the currently supported WhatsApp message schema.

### 🛍️ Order

```js
sock.sendMessage(jid, {
   orderMessage: {
      orderId: 'ORDER_ID',
      itemCount: 1,
      status: 1,
      surface: 1,
      message: 'Casileys Order',
      orderTitle: 'Example Product',
      sellerJid: '0@s.whatsapp.net',
      token: 'ORDER_TOKEN'
   }
}, {
   quoted: message
})
```

### 💳 Request Payment

```js
sock.sendMessage(jid, {
   requestPaymentMessage: {
      currencyCodeIso4217: 'IDR',
      amount1000: 1000000,
      noteMessage: {
         extendedTextMessage: {
            text: 'Payment request'
         }
      }
   }
}, {
   quoted: message
})
```

---

## 👁️ Other Message Options

### 🤖 AI Icon

```js
sock.sendMessage(jid, {
   text: 'Casileys',
   ai: true
})
```

### 🕒 Ephemeral

```js
sock.sendMessage(jid, {
   ephemeral: true,
   text: 'Ephemeral message'
})
```

### 📰 External Ad Reply

```js
sock.sendMessage(jid, {
   text: 'Check this out.',
   externalAdReply: {
      title: 'Casileys',
      body: 'WhatsApp Web API',
      thumbnail: fs.readFileSync('./thumbnail.jpg'),
      mediaType: 1,
      renderLargerThumbnail: true,
      sourceUrl: 'YOUR_SOURCE_URL'
   }
})
```

### 📑 Spoiler

```js
sock.sendMessage(jid, {
   spoiler: true,
   text: 'Spoiler message'
})
```

### 👁️ View Once

```js
sock.sendMessage(jid, {
   viewOnce: true,
   image: {
      url: './path/to/image.jpg'
   }
})
```

### 👁️ View Once V2

```js
sock.sendMessage(jid, {
   viewOnceV2: true,
   video: {
      url: './path/to/video.mp4'
   }
})
```

### 👁️ View Once V2 Extension

```js
sock.sendMessage(jid, {
   viewOnceV2Extension: true,
   image: {
      url: './path/to/image.jpg'
   }
})
```

### 🐱 Lottie Sticker

```js
sock.sendMessage(jid, {
   sticker: {
      url: './path/to/animation.webp'
   },
   isLottie: true
})
```

### 🏷️ Secure Meta Service Label

```js
sock.sendMessage(jid, {
   text: 'Casileys',
   secureMetaServiceLabel: true
})
```

### 🧩 Raw

```js
sock.sendMessage(jid, {
   raw: {
      message: {
         conversation: 'Raw message'
      }
   }
})
```

---

## 🧑‍🧑‍🧒 Group Status

Casileys adds a dedicated helper for publishing group status content.

**Direct message option**

```js
sock.sendMessage(jid, {
   groupStatus: true,
   image: {
      url: './path/to/image.jpg'
   },
   caption: 'Group Status'
})
```

**Helper API**

```js
import {
   sendGroupStatusText,
   sendGroupStatusImage,
   sendGroupStatusVideo,
   sendGroupStatusAudio,
   sendGroupStatusSticker
} from '@kaels/casileys'
```

**Text**

```js
await sendGroupStatusText(
   sock,
   '120000000000000000@g.us',
   'Hello from Casileys'
)
```

**Image**

```js
import fs from 'fs'

await sendGroupStatusImage(
   sock,
   '120000000000000000@g.us',
   fs.readFileSync('./image.jpg'),
   {
      caption: 'Casileys Group Status'
   }
)
```

**Video**

```js
import fs from 'fs'

await sendGroupStatusVideo(
   sock,
   '120000000000000000@g.us',
   fs.readFileSync('./video.mp4'),
   {
      caption: 'Casileys Group Status'
   }
)
```

**Audio**

```js
import fs from 'fs'

await sendGroupStatusAudio(
   sock,
   '120000000000000000@g.us',
   fs.readFileSync('./audio.ogg'),
   {
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
   }
)
```

**Sticker**

```js
import fs from 'fs'

await sendGroupStatusSticker(
   sock,
   '120000000000000000@g.us',
   fs.readFileSync('./sticker.webp'),
   {
      caption: 'Casileys Group Status'
   }
)
```

**WebP support**

The helper can process WebP sticker input:

| Input | Result |
|---|---|
| Static WebP | Image |
| Animated WebP | Video |
| JPEG / PNG | Image |
| MP4 | Video |
| OGG / Opus | Audio |
| Text | Text |

Animated WebP conversion uses FFmpeg.

---

## ♻️ Modify Messages

### 🗑️ Delete

```js
sock.sendMessage(jid, {
   delete: message.key
})
```

### ✏️ Edit

```js
sock.sendMessage(jid, {
   text: 'Edited message'
}, {
   edit: message.key
})
```

---

## 🧰 Additional Contents

### 🏷️ Find User ID

```js
const result = await sock.onWhatsApp(
   '628123456789'
)

console.log(result)
```

### 🔑 Request Custom Pairing Code

```js
const code = await sock.requestPairingCode(
   '628123456789'
)

console.log(code)
```

### 🖼️ Image Processing

```js
const imageLibrary =
   await getImageProcessingLibrary()

console.log(imageLibrary)
```

---

## 📣 Newsletter Management

Newsletter JIDs use:

```
123456789012345678@newsletter
```

Example:

```js
const newsletterJid =
   '123456789012345678@newsletter'

await sock.sendMessage(
   newsletterJid,
   {
      text: 'Hello from Casileys'
   }
)
```

Newsletter media and message operations use the same socket/message infrastructure.

---

## 👥 Group Management

**Fetch groups**

```js
const groups =
   await sock.groupFetchAllParticipating()

console.log(groups)
```

**Create group**

```js
const group =
   await sock.groupCreate(
      'Casileys Community',
      [
         '628123456789@s.whatsapp.net'
      ]
   )

console.log(group)
```

**Update participants**

```js
await sock.groupParticipantsUpdate(
   '120000000000000000@g.us',
   [
      '628123456789@s.whatsapp.net'
   ],
   'add'
)
```

The participant action can be changed to:

| Action | Description |
|---|---|
| `add` | Add a participant to the group |
| `remove` | Remove a participant from the group |
| `promote` | Promote a participant to admin |
| `demote` | Demote a participant from admin |

**Update subject**

```js
await sock.groupUpdateSubject(
   '120000000000000000@g.us',
   'Casileys Community'
)
```

**Update description**

```js
await sock.groupUpdateDescription(
   '120000000000000000@g.us',
   'Community powered by Casileys.'
)
```

**Leave**

```js
await sock.groupLeave(
   '120000000000000000@g.us'
)
```

---

## 👥 Community Management

Community-related operations use the group/community methods provided by the socket and WhatsApp protocol.

---

## 👤 Profile Management

**Profile picture**

```js
const profilePicture =
   await sock.profilePictureUrl(
      '628123456789@s.whatsapp.net',
      'image'
   )

console.log(profilePicture)
```

**Update profile picture**

```js
await sock.updateProfilePicture(
   sock.user.id,
   {
      url: './profile.jpg'
   }
)
```

**Update profile status**

```js
await sock.updateProfileStatus(
   'Powered by Casileys'
)
```

---

## 🛒 Business Management

Business messages can be sent through the same message API.

Product structures can contain fields such as:

```js
{
   currencyCode: 'IDR',
   priceAmount1000: 1000000,
   productId: 'product-id',
   productImageCount: 1,
   title: 'Casileys Product',
   description: 'Product description',
   url: 'YOUR_PRODUCT_URL'
}
```

---

## 🔐 Privacy Management

```js
const privacy =
   await sock.fetchPrivacySettings()

console.log(privacy)
```

---

## 📡 Events

Casileys exposes WhatsApp events through `sock.ev`.

**Messages**

```js
sock.ev.on('messages.upsert', async ({ messages }) => {
   for (const message of messages) {
      if (!message.message) continue

      console.log(message)
   }
})
```

**Connection**

```js
sock.ev.on('connection.update', (update) => {
   const {
      connection,
      lastDisconnect
   } = update

   console.log({
      connection,
      lastDisconnect
   })
})
```

**Credentials**

```js
sock.ev.on('creds.update', saveCreds)
```

---

## ⚠️ Disclaimer

Casileys is an independent fork based on existing Baileys-related projects.

It is not affiliated with WhatsApp or Meta Platforms, Inc.

The project retains appropriate attribution to its upstream projects and contributors.

Fork reference: `https://github.com/itsliaa/baileys`

Please respect the licenses and attribution requirements of the upstream projects when using or redistributing Casileys.

---

## 📣 Credits

**Upstream**

- WhiskeySockets / Baileys
- Original Baileys maintainers and contributors
- Contributors to the WhatsApp protocol ecosystem

**Fork Base**

- ItsLiaaa / Baileys
- Contributors to the fork base

**Casileys**

- Casileys contributors and maintainers
- Contributors to Casileys-specific improvements and utilities

---

## 📄 License

Casileys is released under the MIT License.

See [`LICENSE`](./LICENSE) for the complete license text.
